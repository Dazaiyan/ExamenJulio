import pytest
from app import app, db, User
import bcrypt

@pytest.fixture
def client():
    # Configura la aplicación Flask para el entorno de pruebas
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
    app.config['SECRET_KEY'] = 'testsecretkey'
    
    # Crea un cliente de prueba
    with app.test_client() as client:
        with app.app_context():
            db.create_all()  # Crea las tablas de prueba
        yield client
        with app.app_context():
            db.drop_all()  # Elimina las tablas de prueba

def test_register(client):
    # Prueba la ruta de registro
    response = client.post('/register', data={
        'email': 'testuser@example.com',
        'password': 'testpassword'
    })
    assert response.status_code == 302  # Redirige después del registro
    assert b'User registered successfully!' in response.data

def test_login(client):
    # Primero, registra un usuario
    client.post('/register', data={
        'email': 'testuser@example.com',
        'password': 'testpassword'
    })
    
    # Luego, prueba el inicio de sesión
    response = client.post('/login', data={
        'email': 'testuser@example.com',
        'password': 'testpassword'
    })
    assert response.status_code == 302  # Redirige después del inicio de sesión
    assert b'Login successful!' in response.data

def test_forgot_password(client):
    # Primero, registra un usuario
    client.post('/register', data={
        'email': 'testuser@example.com',
        'password': 'testpassword'
    })

    # Luego, prueba el formulario de recuperación de contraseña
    response = client.post('/forgot_password', data={
        'email': 'testuser@example.com'
    })
    assert response.status_code == 200  # No redirige, muestra un mensaje
    assert b'Password reset email sent!' in response.data

# Puedes agregar más pruebas para otras funcionalidades, como el restablecimiento de la contraseña.
