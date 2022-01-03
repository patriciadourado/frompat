---
title: JWT App - Email Token Registration and Reset Password
date: 2021-09-29T22:23:23.059Z
description: As mentioned in JWT Login Flask post, more features have been added to Flask endpoint and ReactJS application, such as token registration via email and password reset.
featuredImage: "./images/reset-email.png"
---

In this article we gonna describe the new features added to the Flask and ReactJS JWT application started and documented before here: [JWT Login Flask](https://www.patriciadourado.com/frompat/jwt-login-flask/).

## Flask Mail

To start we are going to use the Flask Mail extension to send emails through Flask from our endpoint to the user registered email on the frontend ReactJS app.

![flaskmail](/images/flaskmail.png "Flask-Mail")

> The Flask-Mail extension provides a simple interface to set up SMTP with your Flask application and to send messages from your views and scripts.

### Installation

Through pip we just need to run the following command to install Flask Mail on our Flask application:

`pip install Flask-Mail`

Just remembering we are using **virtualenv** to install our packages and modules;

After installation we need to configure the Flask Mail on our app, like following:

```python
MAIL_SERVER = os.getenv('MAIL_SERVER')
MAIL_PORT  = os.getenv('MAIL_PORT')
MAIL_USERNAME  = os.getenv('MAIL_USERNAME')
MAIL_PASSWORD  = os.getenv('MAIL_PASSWORD')
SUBJECT = os.getenv('SUBJECT')
CONFIRMATION_URI = os.getenv('CONFIRMATION_URI')
```

#### dotenv

_Note: I am using dotenv as a file to not expose my credentials and secret information, that is why the `os.getenv` is necessary, to get the environment variables._

To install **dotenv** just run:
`pip install python-dotenv`

With Flask Mail extension you will need to import doenv and load your credentials from .env file like following:

```python
from flask_mail import Mail
from dotenv import load_dotenv


load_dotenv()  # take environment variables from .env.
```

On your **_.env_** file you should provide your email information such as:

``` 
'MAIL_SERVER' = 'smtp.gmail.com' 
'MAIL_PORT' = 465 
'MAIL_USE_SSL' = True 
'MAIL_USERNAME' = "username@gmail.com" 
'MAIL_PASSWORD' = "password" 
```

### Configuration of mail

After setup all your mail information we need to configurate our mail on Flask app like following:

```python
# configuration of mail
app.config['MAIL_SERVER'] = MAIL_SERVER
app.config['MAIL_PORT'] = MAIL_PORT
app.config['MAIL_USERNAME'] = MAIL_USERNAME
app.config['MAIL_PASSWORD'] = MAIL_PASSWORD
app.config['MAIL_DEFAULT_SENDER'] = (APP_NAME, MAIL_USERNAME)
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
```

And then initialize our mail extension:

```python
#Initialize Mail extension
mail = Mail()
mail.init_app(app)
```

## User Model Change

A small change is necessary to be done in our user Model table of our flask-praetorian block on Flask app, we need to add the attribute table **email** and setup the **is_active** attribute to be false by default, like following:

```python
class User(db.Model):

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.Text, unique=True, nullable=False)
    email = db.Column(db.Text, unique=True, nullable=False)
    password = db.Column(db.Text, nullable=False)
    roles = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=False, server_default='true')

    @property
    def rolenames(self):
        try:
            return self.roles.split(',')
        except Exception:
            return []

    @classmethod
    def lookup(cls, username):
        return cls.query.filter_by(username=username).one_or_none()

    @classmethod
    def lookup(cls, email):
        return cls.query.filter_by(email=email).one_or_none()

    @classmethod
    def identify(cls, id):
        return cls.query.get(id)

    @property
    def identity(self):
        return self.id

    def is_valid(self):
        return self.is_active
```

This will ensure that the application can only be used when the **is_active** attribute is true, which will only happen when the user confirms receipt of the email through the access token that we will send shortly.

**DO NOT FORGET TO CHANGE (ALTER TABLE) YOUR SQL TABLE ON DATABASE, ADDING _email_ ATTRIBUTE AND CHANGING *is_active* ATTRIBUTE!!**

Done that we can focus on our new endpoints we are going to create and change our old ones.

## Registration endpoint

As we will use the method `send_registration_email` from flask-praetorian, on our registration endpoint we need to load the CONFIRMATION_URI which will points to a frontend confirmation uri address with the token sent to the email. In my case it is ***CONFIRMATIONURI = 'https://www.patriciadourado.com/jwtlogin-reactjs/#/finalize'*** with the subject mail as following: ***SUBJECT = 'Please confirm your registration'***;

```python
subject = SUBJECT
confirmation_sender=(APP_NAME, MAIL_USERNAME)
confirmation_uri = CONFIRMATION_URI

```

Its also necessary to load from frontend POST Method the user information such as **username**,**password** and **email**

```python
req = flask.request.get_json(force=True)
username = req.get('username', None)
password = req.get('password', None)
email = req.get('email', None)
```

In our endpoint method we will validate if the **username** or **email** already exists in our database, if not, the user is inserted/registered with a **_201 success message return_**;

```python
    if db.session.query(User).filter_by(username=username).count() < 1:
        if db.session.query(User).filter_by(email=email).count() < 1:
            new_user = User(
                username=username,
                email=email,
                password=guard.hash_password(password),
                roles='user',
            )
            db.session.add(new_user)
            db.session.commit()

            guard.send_registration_email(email, user=new_user, confirmation_sender=confirmation_sender,confirmation_uri=confirmation_uri, subject=subject, override_access_lifespan=None)

            ret = {'message': 'successfully sent registration email to user {}'.format(
                new_user.username
            )}
            return (flask.jsonify(ret), 201)
        else:
            ret = {'message': 'email {} already exists on DB!'.format(email)}
            return (flask.jsonify(ret), 303)
    else:
        ret = {'message':'user {} already exists on DB!'.format(username)}
        return (flask.jsonify(ret), 409)
```

You can check below the ReactJS page which points to our Registration endpoint:

![registration-page](/images/registration.png "Registration-Page")

## Finalize endpoint

After sending the registration email to the user, the token validation is required, for that we will create an endpoint called **_finalize_** where from the frontend GET Method with the token in header token we will get the user, and then activate it in our database.

```python
registration_token = guard.read_token_from_header()
user = guard.get_user_from_registration_token(registration_token)

# user activation
user.is_active = True
db.session.commit()
```

Returning a **_200 success code_** to the frontend along with the JWT token and username:

```python
ret = {'access_token': guard.encode_jwt_token(user), 'user': user.username}
print(ret)
return (flask.jsonify(ret), 200)
```

## Reset Password endpoint

The reset password endpoint will use a different subject email to specify the user that a reset request has been made.

```python
@app.route('/api/reset', methods=['POST'])
def reset():

    """Reset password email"""

    reset_sender=(APP_NAME, MAIL_USERNAME)
    reset_uri = RESET_URI
    subject_rest = SUBJECT_RESET
```

The ReactJS page with its validations for email, used in this application can be seen below:

![send-reset-email](/images/resetpw.png "Send-Reset-Email")

A success message is displayed on the frontend application to show that the email was sent to a valid address.

![success-message](/images/reset-email.png "Success Message")

On the Flask app you will need to specify a **_SUBJECT_RESET_** to your email and a **_reset_uri_** pointing to your frontend page to define a new user password. For example, this page uri was used in our app to redefine the user's password:

![reset-password](/images/reset-password.png "Reset-Password")

With the email from frontend request:

```python
req = flask.request.get_json(force=True)
email = req.get('email', None)
```

We will check if the email exists on our database and if the **_is_active_** table attribute is True (which means the user already activated its account app). If the email exists and the user was activated a reset email is sent to the user through **_send_reset_email_** method from flask-praetorian;

```python
if db.session.query(User).filter_by(email=email).count() > 0:
        if db.session.query(User).filter(User.email==email, User.is_active==True).scalar():
            guard.send_reset_email(email, reset_sender=reset_sender, reset_uri=reset_uri, subject=subject_rest, override_access_lifespan=None)

            ret = {'message': 'successfully sent password reset email to {}'.format(email)}
            return (flask.jsonify(ret), 200)
        else:
            ret = {'message': '{} account not activated! active it first!'.format(email)}
            return (flask.jsonify(ret), 403)
    else:
        ret = {'message': 'email {} doest not exists on DB!'.format(email)}
        return (flask.jsonify(ret), 404)
```

The **_code message 200_** is sent to the frontend if everything goes fine, a **_403 code error message_** is sent if the user is not activated and a **_404 code message_** is sent if the user's email doesn't exists on our database;

## Finalize Reset Password endpoint

The reset password finalize endpoint will validate the token from the POST Method header and if everything goes fine it will hash a new password to the user, storing it in the database.

```python
@app.route('/api/reset_finalize', methods=['POST'])
def reset_finalize():

    """Reset password on database by token"""


    req = flask.request.get_json(force=True)
    password = req.get('password', None)

    reset_token = guard.read_token_from_header()

    try:
        user = guard.validate_reset_token(reset_token)
        user.password = guard.hash_password(password)
        db.session.commit()
        ret = {'access_token': guard.encode_jwt_token(user), 'user': user.username}
        return (flask.jsonify(ret), 200)
    except Exception:
        ret = {"Error resetting user password by token:"}
        return ret, 500
```

A **_200 code message_** is returned to the frontend if the password has been reset and a **_500 code_** is sent if Error.

The Reset Password Finalize endpoint will point to our frontend application a page where the user is redirected if the password has been successfully reset, the page can be a protected page to the application or the login page, its your choice! :)

## My Code Application Available

To have access to all the code for this Flask application you can visit my repository on github which also contains the address for the online application, clicking here: [jwtlogin-flask](https://github.com/patriciadourado/jwtlogin-flask).

You can also check the ReactJS application developed to consume all these endpoints with the Registration, Login and Reset Password pages and validations for email and password on frontend, clicking here: [jwtlogin-reactjs](https://github.com/patriciadourado/jwtlogin-reactjs).

## Thank you

Hope you enjoyed! 

More features are coming soon. :)
