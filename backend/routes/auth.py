import random
import uuid
from datetime import datetime, timedelta

import jwt
from flask import Blueprint, request, jsonify, current_app

from app import db
from app.models import User, OTP, PasswordResetToken
from middleware.auth_middleware import token_required

auth_bp = Blueprint('auth', __name__)


def _generate_otp():
    """Generate a random 6-digit OTP code."""
    return str(random.randint(100000, 999999))


def _generate_jwt_token(user):
    """Generate a JWT token for the given user."""
    payload = {
        'user_id': user.id,
        'email': user.email,
        'exp': datetime.utcnow() + timedelta(hours=current_app.config['JWT_EXPIRY_HOURS'])
    }
    token = jwt.encode(
        payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )
    return token


def _is_valid_email(email):
    """Basic email format validation."""
    if not email or '@' not in email:
        return False
    parts = email.split('@')
    if len(parts) != 2:
        return False
    local, domain = parts
    if not local or not domain:
        return False
    if '.' not in domain:
        return False
    return True


# ─── POST /register ──────────────────────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required.'}), 400

        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        # Validate required fields
        if not name:
            return jsonify({'error': 'Name is required.'}), 400
        if not email:
            return jsonify({'error': 'Email is required.'}), 400
        if not password:
            return jsonify({'error': 'Password is required.'}), 400

        # Validate email format
        if not _is_valid_email(email):
            return jsonify({'error': 'Invalid email format.'}), 400

        # Validate password length
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long.'}), 400

        # Check if email already taken
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'An account with this email already exists.'}), 409

        # Create user
        user = User(name=name, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        # Generate OTP
        otp_code = _generate_otp()
        otp_expiry = datetime.utcnow() + timedelta(minutes=current_app.config['OTP_EXPIRY_MINUTES'])
        otp = OTP(
            user_id=user.id,
            otp_code=otp_code,
            expires_at=otp_expiry
        )
        db.session.add(otp)
        db.session.commit()

        # Print OTP to console (development mode)
        print(f"\n{'='*50}\nOTP for {email}: {otp_code}\n{'='*50}\n")

        return jsonify({
            'message': 'Registration successful. Please verify your email with the OTP sent.',
            'user_id': user.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500


# ─── POST /verify-otp ────────────────────────────────────────────────────────
@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required.'}), 400

        user_id = data.get('user_id')
        otp_code = data.get('otp_code', '').strip()

        if not user_id:
            return jsonify({'error': 'User ID is required.'}), 400
        if not otp_code:
            return jsonify({'error': 'OTP code is required.'}), 400

        # Find the user
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found.'}), 404

        # Find valid OTP (not used, not expired, matching code)
        otp = OTP.query.filter_by(
            user_id=user_id,
            otp_code=otp_code,
            is_used=False
        ).order_by(OTP.created_at.desc()).first()

        if not otp:
            return jsonify({'error': 'Invalid OTP code.'}), 400

        if otp.expires_at < datetime.utcnow():
            return jsonify({'error': 'OTP has expired. Please request a new one.'}), 400

        # Mark OTP as used and verify email
        otp.is_used = True
        user.email_verified = True
        db.session.commit()

        # Generate JWT token
        token = _generate_jwt_token(user)

        return jsonify({
            'message': 'Email verified successfully.',
            'token': token,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'OTP verification failed: {str(e)}'}), 500


# ─── POST /resend-otp ────────────────────────────────────────────────────────
@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required.'}), 400

        user_id = data.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID is required.'}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found.'}), 404

        # Invalidate all existing unused OTPs for this user
        OTP.query.filter_by(user_id=user_id, is_used=False).update({'is_used': True})

        # Generate new OTP
        otp_code = _generate_otp()
        otp_expiry = datetime.utcnow() + timedelta(minutes=current_app.config['OTP_EXPIRY_MINUTES'])
        otp = OTP(
            user_id=user.id,
            otp_code=otp_code,
            expires_at=otp_expiry
        )
        db.session.add(otp)
        db.session.commit()

        # Print OTP to console (development mode)
        print(f"\n{'='*50}\nOTP for {user.email}: {otp_code}\n{'='*50}\n")

        return jsonify({
            'message': 'A new OTP has been sent to your email.'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to resend OTP: {str(e)}'}), 500


# ─── POST /login ─────────────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required.'}), 400

        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email:
            return jsonify({'error': 'Email is required.'}), 400
        if not password:
            return jsonify({'error': 'Password is required.'}), 400

        # Find user by email
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'Invalid email or password.'}), 401

        # Verify password
        if not user.check_password(password):
            return jsonify({'error': 'Invalid email or password.'}), 401

        # Check if email is verified
        if not user.email_verified:
            return jsonify({
                'error': 'Email not verified. Please verify your email first.',
                'user_id': user.id,
                'requires_verification': True
            }), 403

        # Generate JWT token
        token = _generate_jwt_token(user)

        return jsonify({
            'message': 'Login successful.',
            'token': token,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500


# ─── POST /forgot-password ───────────────────────────────────────────────────
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required.'}), 400

        email = data.get('email', '').strip().lower()
        if not email:
            return jsonify({'error': 'Email is required.'}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            # Return success even if user not found (security best practice)
            return jsonify({
                'message': 'If an account with that email exists, a password reset link has been sent.'
            }), 200

        # Generate UUID reset token
        reset_token = str(uuid.uuid4())
        token_expiry = datetime.utcnow() + timedelta(
            minutes=current_app.config['RESET_TOKEN_EXPIRY_MINUTES']
        )

        # Invalidate existing unused reset tokens for this user
        PasswordResetToken.query.filter_by(
            user_id=user.id, is_used=False
        ).update({'is_used': True})

        # Create new reset token
        reset = PasswordResetToken(
            user_id=user.id,
            token=reset_token,
            expires_at=token_expiry
        )
        db.session.add(reset)
        db.session.commit()

        # Print reset token to console (development mode)
        print(f"\n{'='*50}\nPassword Reset Token for {email}: {reset_token}\n{'='*50}\n")

        return jsonify({
            'message': 'If an account with that email exists, a password reset link has been sent.'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to process request: {str(e)}'}), 500


# ─── POST /reset-password ────────────────────────────────────────────────────
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required.'}), 400

        token = data.get('token', '').strip()
        new_password = data.get('new_password', '')

        if not token:
            return jsonify({'error': 'Reset token is required.'}), 400
        if not new_password:
            return jsonify({'error': 'New password is required.'}), 400
        if len(new_password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long.'}), 400

        # Find valid reset token
        reset = PasswordResetToken.query.filter_by(
            token=token,
            is_used=False
        ).first()

        if not reset:
            return jsonify({'error': 'Invalid or already used reset token.'}), 400

        if reset.expires_at < datetime.utcnow():
            return jsonify({'error': 'Reset token has expired. Please request a new one.'}), 400

        # Update password
        user = User.query.get(reset.user_id)
        if not user:
            return jsonify({'error': 'User not found.'}), 404

        user.set_password(new_password)
        reset.is_used = True
        db.session.commit()

        return jsonify({
            'message': 'Password has been reset successfully. You can now log in with your new password.'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Password reset failed: {str(e)}'}), 500


# ─── GET /me ─────────────────────────────────────────────────────────────────
@auth_bp.route('/me', methods=['GET'])
@token_required
def get_me(current_user):
    try:
        return jsonify({
            'user': current_user.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch user info: {str(e)}'}), 500


# ─── POST /google ────────────────────────────────────────────────────────────
@auth_bp.route('/google', methods=['POST'])
def google_auth():
    return jsonify({
        'message': 'Google OAuth not configured yet'
    }), 501


# ─── POST /logout ────────────────────────────────────────────────────────────
@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({
        'message': 'Logged out successfully.'
    }), 200
