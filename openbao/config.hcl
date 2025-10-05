ui = false

storage "file" {
  path = "/openbao/file/"
}

seal "static" {
  current_key_id = "1"
  current_key    = "file:///openbao/file/unseal.key"
}

listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_disable   = true
}

initialize "auth-backend" {
  request "enable-userpass" {
    operation = "create"
    path = "sys/auth/userpass"
    data = {
      type = "userpass"
      description = "Username/password authentication for backend service"
    }
  }
  request "create-backend-user" {
    operation = "create"
    path = "auth/userpass/users/backend"
    data = {
      password = "S0Z19QMNIovOj10B9v5Lwb9sPOXT1Xai"
      token_policies = "backend"
      token_ttl = "1h"
      token_max_ttl = "24h"
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
  request "create-backend" {
    operation = "create"
    path = "sys/policies/acl/backend"
    data = {
      policy = <<EOT
# Backend can manage all user secrets
path "secrets/data/users/*" {
  capabilities = ["create", "read", "update", "delete", "list", "scan"]
}

path "secrets/metadata/users/*" {
  capabilities = ["create", "read", "update", "delete", "list", "scan"]
}
EOT
    }
  }
}
