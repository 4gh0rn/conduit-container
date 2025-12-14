from django.http import JsonResponse
from django.views.decorators.http import require_http_methods


@require_http_methods(["GET"])
def health_check(request):
    """
    Health check endpoint for container orchestration.
    Returns 200 OK if the service is healthy.
    """
    return JsonResponse({"status": "healthy", "service": "conduit-backend"}, status=200)
