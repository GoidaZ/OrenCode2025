ui = false

storage "raft" {
  path = "/var/lib/raft/"
  node_id = "raft_node_1"
}

listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = "true"
}

initialize "auth" {
  request "enable-oidc" {
    operation = "create"
    path = "sys/auth/keycloak"
    data = {
      type = "oidc"
      description = "Keycloak authentication"
    }
  }
  request "configure-keycloak" {
    operation = "create"
    path = "auth/keycloak/config"
    data = {
      oidc_client_id = "secretmanager"
      oidc_client_secret = "HZ7KVvK2qtecvr0YwC8fmFbFDFEzK9iY"
      oidc_discovery_url = "http://keycloak:8080/auth/realms/secretmanager"
      default_role = "default"
    }
  }
  request "create-oidc-role-default" {
    operation = "create"
    path = "auth/keycloak/role/default"
    data = {
      user_claim = "preferred_username"
      allowed_redirect_uris = [
        "secretmanager://callback"
      ]
      policies = "per-user"
      ttl = "1h"
    }
  }
  request "create-oidc-role-backend" {
    operation = "create"
    path = "auth/keycloak/role/backend"
    data = {
      user_claim = "client_id"
      allowed_redirect_uris = []
      policies = "backend"
      ttl = "24h"
    }
  }
}

initialize "kv" {
  request "mount-secrets" {
    operation = "create"
    path = "sys/mounts/secrets"
    data = {
      type = "kv"
      decription = "SecretManager key-value store"
      options = {
        version = "2"
      }
    }
  }
}

initialize "policy" {
  request "create-per-user" {
    operation = "create"
    path = "sys/policies/acl/per-user"
    data = {
      policy = <<EOT
# Allow each user to manage their own secrets
path "secrets/data/users/{{identity.entity.aliases.keycloak.name}}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Allow full access to metadata for their own secrets
path "secrets/metadata/users/{{identity.entity.aliases.keycloak.name}}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
EOT
    }
  }
  request "create-backend" {
    operation = "create"
    path = "sys/policies/acl/backend"
    data = {
      policy = <<EOT
# Backend can manage all user secrets
path "secrets/data/users/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secrets/metadata/users/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
EOT
    }
  }
}
