from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
import os
import bcrypt

app = Flask(__name__)
app.config['SECRET_KEY'] = 'u8Jk%3nGzF^1bLmNq@4WpXsY!7zA*rTf'
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:12345@localhost/examenjulio'
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USERNAME'] = 'jvi3991zrj@gmail.com'
app.config['MAIL_PASSWORD'] = 'cbrq etia joji rdww'
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False

db = SQLAlchemy(app)
mail = Mail(app)

# Modelo de la base de datos
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        new_user = User(email=email, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        flash('User registered successfully!')
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = User.query.filter_by(email=email).first()
        if user and bcrypt.checkpw(password.encode('utf-8'), user.password):
            session['user_id'] = user.id
            flash('Login successful!')
            return redirect(url_for('home'))
        else:
            flash('Login failed. Check your email and/or password.')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('You have been logged out.')
    return redirect(url_for('home'))

@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form['email']
        user = User.query.filter_by(email=email).first()
        if user:
            token = 'your_token_generation_logic_here'
            link = url_for('reset_password', token=token, _external=True)
            msg = Message('Password Reset Request', sender='your_email@gmail.com', recipients=[email])
            msg.body = f'Click the following link to reset your password: {link}'
            mail.send(msg)
            flash('Password reset email sent!')
        else:
            flash('Email not found.')
    return render_template('forgot_password.html')

@app.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    if request.method == 'POST':
        password = request.form['password']
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        # Here you should verify the token and update the user's password
        # This example skips token verification for brevity
        user = User.query.filter_by(email='user_email@example.com').first()
        user.password = hashed_password
        db.session.commit()
        flash('Password updated successfully!')
        return redirect(url_for('login'))
    return render_template('reset_password.html')

if __name__ == '__main__':
    app.run(debug=True)
