#!/usr/bin/env bash
# Read-only connectivity inspection. Never print raw configs, logs or secrets.
set -u -o pipefail
export LC_ALL=C
domain="marketdomstroy.ru"
section() { printf '\n== %s ==\n' "$1"; }
has() { command -v "$1" >/dev/null 2>&1; }

section "Runtime"
date -u '+UTC %Y-%m-%dT%H:%M:%SZ'
has uname && uname -sr
has openssl && openssl version
has nginx && nginx -v 2>&1
nginx_config=""
if has nginx; then
  # Keep the full expanded config in memory only; print an explicit allowlist.
  nginx_test="$(nginx -t 2>&1)"; test_result=$?
  printf 'nginx -t exit=%s\n' "$test_result"
  printf '%s\n' "$nginx_test" | awk '
    /syntax is ok/ {print "configuration syntax: ok"}
    /test is successful/ {print "configuration test: successful"}
    /\[emerg\]/ {n++} END {if(n) print "configuration emergency errors:", n}'
  nginx_config="$(nginx -T 2>/dev/null)"
  section "Selected nginx directives (expanded configuration)"
  printf '%s\n' "$nginx_config" | awk '
    /^# configuration file / {print; next}
    /^[[:space:]]*(server_name|listen|http2|ssl_protocols|ssl_ecdh_curve|ssl_conf_command|ssl_buffer_size|ssl_reject_handshake)[[:space:]]/ {
      sub(/#.*/, ""); sub(/;.*/, ";"); print; next
    }
    /^[[:space:]]*return[[:space:]]+444[[:space:]]*;/ {print "    return 444;"}'
  printf '%s\n' "$nginx_config" | awk '
    /^[[:space:]]*#/ {next}
    /^[[:space:]]*deny[[:space:]]/ {deny++}
    /^[[:space:]]*allow[[:space:]]/ {allow++}
    /^[[:space:]]*(geo|geoip|geoip2)[[:space:]]/ {geo++}
    END {printf "policy_directive_counts deny=%d allow=%d geo=%d\n",deny,allow,geo}'
else
  printf 'nginx: unavailable\n'
fi

section "Current upstream port"
if [ -r /etc/nginx/conf.d/domstroy-upstream.conf ]; then
  awk 'match($0, /127\.0\.0\.1:[0-9]+/) {
    value=substr($0,RSTART,RLENGTH); sub(/.*:/,"",value); print "port=" value
  }' /etc/nginx/conf.d/domstroy-upstream.conf
else
  printf 'upstream configuration: unavailable\n'
fi

section "Service and certificate renewal states (no logs or environment)"
if has systemctl; then
  for unit in nginx.service domstroy.service domstroy-4000.service domstroy-4001.service \
    certbot.timer snap.certbot.renew.timer certbot-renew.timer; do
    printf '%s\n' "$unit"
    systemctl show "$unit" --no-pager --property=LoadState,ActiveState,SubState,UnitFileState \
      2>/dev/null || printf 'state: unavailable\n'
    case "$unit" in
      *.timer) systemctl show "$unit" --no-pager \
        --property=NextElapseUSecRealtime,LastTriggerUSec 2>/dev/null || true ;;
    esac
  done
else
  printf 'systemctl: unavailable\n'
fi

section "Public certificate served locally with the correct SNI"
if has openssl && has timeout; then
  certificate="$(timeout 15 openssl s_client -connect 127.0.0.1:443 \
    -servername "$domain" -showcerts </dev/null 2>/dev/null)"
  if ! printf '%s\n' "$certificate" | openssl x509 -noout -subject -issuer -dates \
    -serial -fingerprint -sha256 -ext subjectAltName 2>/dev/null; then
    printf 'certificate metadata: unavailable\n'
  fi
  unset certificate
else
  printf 'openssl or timeout: unavailable\n'
fi

section "Local HTTPS health through nginx (certificate verification enabled)"
if has curl; then
  for host in "$domain" "www.$domain"; do
    for tls in 1.2 1.3; do
      printf 'host=%s TLS=%s ' "$host" "$tls"
      curl --noproxy '*' --silent --output /dev/null --connect-timeout 5 --max-time 15 \
        --resolve "$host:443:127.0.0.1" "--tlsv$tls" --tls-max "$tls" \
        --write-out 'http=%{http_code} verify=%{ssl_verify_result} time=%{time_total}s' \
        "https://$host/api/health" 2>/dev/null
      printf ' curl_exit=%s\n' "$?"
    done
  done
else
  printf 'curl: unavailable\n'
fi

section "Network interface names and MTUs only"
if has ip; then
  ip -o link show 2>/dev/null | awk '{
    name=$2; sub(/:$/,"",name)
    for(i=1;i<NF;i++) if($i=="mtu") print name, "mtu=" $(i+1)
  }'
else
  printf 'ip: unavailable\n'
fi

section "TCP MTU probing"
if has sysctl; then
  for key in net.ipv4.tcp_mtu_probing net.ipv6.tcp_mtu_probing; do
    if value="$(sysctl -n "$key" 2>/dev/null)"; then
      printf '%s=%s\n' "$key" "$value"
    else
      printf '%s=unavailable (Linux commonly uses the IPv4-named TCP setting for both)\n' "$key"
    fi
  done
else
  printf 'sysctl: unavailable\n'
fi

section "TCPMSS mangle rules only (address match conditions omitted)"
for tool in iptables ip6tables; do
  if has "$tool"; then
    rules="$("$tool" -t mangle -S 2>/dev/null)"; rules_result=$?
    printf '%s exit=%s\n' "$tool" "$rules_result"
    printf '%s\n' "$rules" | awk '/-j TCPMSS([[:space:]]|$)/ {
      printf "chain=%s TCPMSS", $2
      for(i=1;i<=NF;i++) {
        if($i=="--clamp-mss-to-pmtu") printf " %s", $i
        if($i=="--set-mss" && $(i+1) ~ /^[0-9]+$/) printf " %s %s",$i,$(i+1)
      }
      print ""; n++
    } END {print "TCPMSS_rule_count=" n+0}'
  else
    printf '%s: unavailable\n' "$tool"
  fi
done

section "Nginx status counts (last 5000 entries per standard log; no visitor data)"
for logfile in /var/log/nginx/access.log /var/log/nginx/domstroy.access.log; do
  [ -r "$logfile" ] || continue
  printf '%s\n' "$logfile"
  tail -n 5000 "$logfile" 2>/dev/null | awk '
    {total++; if(match($0,/" [1-5][0-9][0-9] /)) count[substr($0,RSTART+2,3)]++; else unknown++}
    END {print "sample_entries=" total+0; for(code in count) print "HTTP_" code "=" count[code]; print "unparsed=" unknown+0}' | sort
done
section "Nginx error categories (last 1000 entries per standard log; no raw lines)"
for logfile in /var/log/nginx/error.log /var/log/nginx/domstroy.error.log; do
  [ -r "$logfile" ] || continue
  printf '%s\n' "$logfile"
  tail -n 1000 "$logfile" 2>/dev/null | awk '
    {line=tolower($0); total++
      if(line ~ /ssl|tls|handshake/) tls++
      else if(line ~ /timed out|timeout/) timeout++
      else if(line ~ /upstream|connect\(\) failed/) upstream++
      else if(line ~ /access forbidden|permission denied/) denied++
      else other++
    }
    END {printf "sample_entries=%d tls=%d timeout=%d upstream=%d denied=%d other=%d\n",total,tls,timeout,upstream,denied,other}'
  tail -n 1000 "$logfile" 2>/dev/null | awk '
    match($0,/SSL routines:[[:alnum:] _:-]+/) {reason[substr($0,RSTART,RLENGTH)]++}
    END {for(item in reason) print "openssl_reason=" item " count=" reason[item]}' | sort
done

section "Requested VPN test marker (timestamps and statuses only)"
if [ -r /var/log/nginx/access.log ]; then
  tail -n 20000 /var/log/nginx/access.log | awk '
    /[?&]vpncheck=20261106([& \" ]|$)/ {
      count++
      if(match($0,/\[[0-9][0-9]\/[[:alpha:]][[:alpha:]][[:alpha:]]\/[0-9][0-9][0-9][0-9]:[0-9:]+ [+-][0-9]+\]/))
        stamp=substr($0,RSTART,RLENGTH)
      else stamp="unavailable"
      if(match($0,/\" [1-5][0-9][0-9] /)) status=substr($0,RSTART+2,3)
      else status="unavailable"
      print "test_time=" stamp " status=" status
    }
    END {print "marker_request_count=" count+0}'
fi
unset nginx_config nginx_test rules
