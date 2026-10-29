import ipaddress
import socket
import urllib.parse
from typing import Tuple

BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),  # Cloud metadata IP (169.254.169.254)
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

def validate_url_safe(url: str, allow_http: bool = True) -> Tuple[bool, str]:
    """
    Validate that a given URL is safe to download from, strictly preventing SSRF.
    Rejects private IPs, link-local IPs, cloud metadata endpoints, loopback, and unsupported schemes.
    """
    if not url:
        return False, "URL cannot be empty."

    try:
        parsed = urllib.parse.urlparse(url)
    except Exception as e:
        return False, f"Invalid URL structure: {str(e)}"

    # Scheme check
    allowed_schemes = ["https", "http"] if allow_http else ["https"]
    if parsed.scheme.lower() not in allowed_schemes:
        return False, f"Forbidden URL scheme '{parsed.scheme}'. Only {allowed_schemes} are permitted."

    hostname = parsed.hostname
    if not hostname:
        return False, "URL must include a valid hostname."

    # Check for direct loopback or internal names
    lower_host = hostname.lower()
    if lower_host in ["localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal"]:
        return False, f"Target host '{hostname}' is a forbidden local/internal address."

    # Resolve IP addresses
    try:
        addr_infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        return False, f"Unable to resolve host '{hostname}'."
    except Exception as e:
        return False, f"DNS resolution failed: {str(e)}"

    for family, socktype, proto, canonname, sockaddr in addr_infos:
        ip_str = sockaddr[0]
        try:
            ip_obj = ipaddress.ip_address(ip_str)
        except ValueError:
            return False, f"Invalid resolved IP '{ip_str}'."

        if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_reserved or ip_obj.is_multicast:
            return False, f"Host '{hostname}' resolved to private/restricted IP '{ip_str}'."

        for network in BLOCKED_IP_NETWORKS:
            if ip_obj in network:
                return False, f"Host '{hostname}' resolved to blocked network '{network}' ({ip_str})."

    return True, "URL is safe."
