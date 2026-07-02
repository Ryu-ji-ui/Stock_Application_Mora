from functools import wraps
from flask import request, jsonify, current_app
import jwt
from app.models import User


def token_required(f):
    """Decorator that requires a valid JWT token in the Authorization header.
    Attaches the current_user to the function kwargs.
    Returns 401 if token is missing, invalid, or expired.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Extract token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1]

        if not token:
            return jsonify({'error': 'Authentication token is missing. Please include a valid Bearer token in the Authorization header.'}), 401

        try:
            # Decode the JWT token
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            current_user = User.query.get(payload['user_id'])

            if not current_user:
                return jsonify({'error': 'User associated with this token no longer exists.'}), 401

        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Authentication token has expired. Please log in again.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid authentication token. Please log in again.'}), 401

        # Attach current_user to kwargs
        kwargs['current_user'] = current_user
        return f(*args, **kwargs)

    return decorated


def token_optional(f):
    """Decorator that optionally attaches a user if a valid JWT token is present.
    Does NOT fail if no token is provided — current_user will be None in that case.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = None

        # Extract token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1]
            try:
                payload = jwt.decode(
                    token,
                    current_app.config['JWT_SECRET_KEY'],
                    algorithms=['HS256']
                )
                current_user = User.query.get(payload['user_id'])
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
                # Token is invalid/expired but we don't fail — just proceed without user
                pass

        kwargs['current_user'] = current_user
        return f(*args, **kwargs)

    return decorated
