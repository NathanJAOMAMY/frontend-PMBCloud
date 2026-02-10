package main

# OPA/Conftest policy for nginx.conf validation
# Input: plain text content of nginx.conf

# CRITICAL: X-Frame-Options header
deny[msg] {
    not contains(input, "X-Frame-Options")
    msg := "CRITICAL: Missing X-Frame-Options header"
}

# CRITICAL: X-Content-Type-Options header
deny[msg] {
    not contains(input, "X-Content-Type-Options")
    msg := "CRITICAL: Missing X-Content-Type-Options header"
}

# CRITICAL: Content-Security-Policy header
deny[msg] {
    not contains(input, "Content-Security-Policy")
    msg := "CRITICAL: Missing Content-Security-Policy header"
}

# HIGH: HSTS header
warn[msg] {
    not contains(input, "Strict-Transport-Security")
    msg := "HIGH: Add Strict-Transport-Security (HSTS) header"
}

# HIGH: access logging
warn[msg] {
    not contains(input, "access_log")
    msg := "HIGH: Configure access_log for audit"
}

# HIGH: hide server version
warn[msg] {
    contains(input, "server_tokens")
    not contains(input, "server_tokens off")
    msg := "HIGH: Set server_tokens off to hide Nginx version"
}

# MEDIUM: gzip compression
warn[msg] {
    not contains(input, "gzip")
    msg := "MEDIUM: Consider enabling gzip compression"
}



