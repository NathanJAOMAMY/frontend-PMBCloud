package main

# OPA/Conftest policy for Dockerfile validation
# Input: plain text content of Dockerfile

# CRITICAL: FROM directive required
deny[msg] {
    not contains(input, "FROM")
    msg := "CRITICAL: Dockerfile must start with FROM directive"
}

# CRITICAL: Non-root USER required
deny[msg] {
    contains(input, "FROM")
    not contains(input, "USER")
    msg := "CRITICAL: Dockerfile must set USER to non-root"
}

deny[msg] {
    contains(input, "USER root")
    msg := "CRITICAL: Dockerfile cannot set USER to root"
}

# CRITICAL: No :latest tag
deny[msg] {
    regex.match("FROM.*:latest", input)
    msg := "CRITICAL: Do not use :latest tag, specify exact version"
}

# HIGH: HEALTHCHECK recommended
warn[msg] {
    contains(input, "FROM")
    not contains(input, "HEALTHCHECK")
    msg := "HIGH: Add HEALTHCHECK directive"
}

# HIGH: LABEL recommended
warn[msg] {
    contains(input, "FROM")
    not contains(input, "LABEL")
    msg := "HIGH: Add LABEL directives for metadata"
}

# HIGH: apt cleanup
warn[msg] {
    contains(input, "apt-get install")
    not contains(input, "rm -rf /var/lib/apt/lists")
    msg := "HIGH: Clean up apt cache after install"
}

# HIGH: Alpine apk-cache
warn[msg] {
    contains(input, "apk add")
    not contains(input, "--no-cache")
    msg := "HIGH: Use apk add --no-cache for Alpine"
}


