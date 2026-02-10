package main

# OPA/Conftest policy for docker-compose.yml validation

# CRITICAL: version required
deny[msg] {
    not input.version
    msg := "CRITICAL: docker-compose.yml must specify version"
}

# CRITICAL: version >= 3.8
deny[msg] {
    input.version
    to_number(input.version) < 3.8
    msg := "CRITICAL: docker-compose.yml version must be >= 3.8"
}

# HIGH: networks should be defined
warn[msg] {
    not input.networks
    msg := "HIGH: Define explicit networks instead of default bridge"
}

# HIGH: services missing restart_policy
warn[msg] {
    service := input.services[_]
    not service.restart_policy
    msg := "HIGH: Service missing restart_policy"
}

# HIGH: privileged mode
warn[msg] {
    service := input.services[_]
    service.privileged == true
    msg := "HIGH: Service uses privileged mode - restrict if possible"
}

# MEDIUM: resource limits
warn[msg] {
    service := input.services[_]
    not service.deploy
    msg := "MEDIUM: Service missing resource limits"
}



