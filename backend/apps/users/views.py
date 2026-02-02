"""
Authentication views.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.contrib.auth import login, logout
from django.middleware.csrf import get_token

from .serializers import LoginSerializer, UserSerializer


class LoginView(APIView):
    """
    User login endpoint.
    Uses session-based authentication.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        login(request, user)
        
        # Return user data and CSRF token
        return Response({
            'user': UserSerializer(user).data,
            'csrf_token': get_token(request),
            'message': 'Login exitoso'
        })


class LogoutView(APIView):
    """
    User logout endpoint.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        logout(request)
        return Response({'message': 'Logout exitoso'})


class CurrentUserView(APIView):
    """
    Get current authenticated user info.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'user': UserSerializer(request.user).data,
            'csrf_token': get_token(request),
        })


class CSRFTokenView(APIView):
    """
    Get CSRF token for forms.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({
            'csrf_token': get_token(request)
        })
