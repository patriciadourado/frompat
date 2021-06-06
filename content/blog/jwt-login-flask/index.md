---
title: JWT Login Flask
date: 2021-05-29T22:01:45.059Z
description: A Flask JWT based login authentication using flask-praetorian
  module to handle the hard part and SQLAlchemy as ORM with PostreSQL as
  database.
---
This is a simple tutorial to help you build a simple JWT based login application and registration using the micro web framework **Flask**.

Before running the Flask API its necessary to install a bunch of packages as you can check listed here [requirements.txt](https://github.com/patriciadourado/jwtlogin-flask/blob/master/requirements.txt).

## Python Virtual Environment

To install the required modules I've used `Python virtualenv` to create a isolated Virtual Environment in Python so the project can have it's own dependencies independently of other project's dependencies. In resume: for not installing globally this modules. 

![Python virtualenv](python-virtualenv-project-structure.jpg)

#### Installation

To install `virtualenv` just run the following command on your project folder (here we use pip on windows):

`py -3 -m pip install --user virtualenv`

#### Creating a Virtual Environment

To create a Virtual Environment name **myproject**:

`py -3 -m venv myproject`

You will see a new folder created called **myproject**

#### Activation

To activate and use your new virtual environment, just run:

`myproject\Scripts\activate`

Now you can start to install the modules and packages you want and run your project on the new environment. 

To install requeriments.txt just this command:

`pip install -r requirements.txt`

To deactivate **myproject** just run: `deactivate`.

## PostegreSQL

Its also necessary to create a database and **users** table before anything. I've used [PostegreSQL](https://www.postgresql.org/) as database and pgAdmin 4 interface to create the DB and table.

![pgadmin4](pgadmin4.png)

#### Create users table

The SQL for the created users table is the following:

```SQL
CREATE TABLE public.users
(
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    username text COLLATE pg_catalog."default" NOT NULL,
    password text COLLATE pg_catalog."default" NOT NULL,
    roles text COLLATE pg_catalog."default",
    is_active boolean,
    CONSTRAINT users_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE public.users
    OWNER to (insert here your user_database)
```

## DB Model

A model that might be used using **flask-praetorian**:

```python
class User(db.Model):
    
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.Text, unique=True, nullable=False)
    password = db.Column(db.Text, nullable=False)
    roles = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True, server_default='true')

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
    def identify(cls, id):
        return cls.query.get(id)

    @property
    def identity(self):
        return self.id

    def is_valid(self):
        return self.is_active
```

## Initialize Flask App

```python
app = flask.Flask(__name__)
app.debug = True
app.config['SECRET_KEY'] = 'my secret key'
app.config['JWT_ACCESS_LIFESPAN'] = {'hours': 24}
app.config['JWT_REFRESH_LIFESPAN'] = {'days': 30}

# Initialize the flask-praetorian instance for the app
guard.init_app(app, User)
```

## SQLAlchemy

The [SQLAlchemy](https://www.sqlalchemy.org/) was used as the Python ORM for accessing data from the database and facilitate the communication between app and db converting function calls to SQL statements.

Do not forget to change ***'SQLALCHEMY_DATABASE_URI'*** to your own here:

```python
# Initialize a local database
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user_database:password@hostname:5432/database_name'
db.init_app(app)

# Initializes CORS so that the api_tool can talk to app
cors.init_app(app)
```

## Endpoints

Some endpoints were defined to be consumed by the frontend application, they are:

**1. /api/**

The first endpoint is the confirmation our API is up running!

```python
@app.route('/api/')
def home():
    return {"Hello": "World"}, 200
```

**2. /api/login**

The second endpoint receives the user credentials (by POST request) and authenticates/logs it with flask-praetorian 'authenticate' method issuing a user JWT access token and returning a 200 code with the token;

```python
@app.route('/api/login', methods=['POST'])
def login():
    """
    Logs a user in by parsing a POST request containing user credentials and
    issuing a JWT token.
    """
    req = flask.request.get_json(force=True)
    username = req.get('username', None)
    password = req.get('password', None)
    user = guard.authenticate(username, password)
    ret = {'access_token': guard.encode_jwt_token(user)}
    return ret, 200
```

**3. /api/refresh**

The third endpoint refreshes (by POST request) an existing JWT creating a new one with a new access expiration, returning a 200 code with the new token;

```python
@app.route('/api/refresh', methods=['POST'])
def refresh():
    """
    Refreshes an existing JWT by creating a new one that is a copy of the old
    except that it has a refreshed access expiration.
    .. example::
       $ curl http://localhost:5000/api/refresh -X GET \
         -H "Authorization: Bearer <your_token>"
    """
    print("refresh request")
    old_token = Request.get_data()
    new_token = guard.refresh_jwt_token(old_token)
    ret = {'access_token': new_token}
    return ret, 200
```

**4. /api/protected**

The fourth endpoint is a protected endpoint which requires a header with a valid JWT using the `@flask_praetorian.auth_required` decorator. The endpoint returns a message with the current user username as a secret message;

```python
@app.route('/api/protected')
@flask_praetorian.auth_required
def protected():
    """
    A protected endpoint. The auth_required decorator will require a header
    containing a valid JWT
    .. example::
       $ curl http://localhost:5000/api/protected -X GET \
         -H "Authorization: Bearer <your_token>"
    """
    return {'message': 'protected endpoint (allowed usr {})'.format(flask_praetorian.current_user().username)}
```

**5. /api/registration**

The fifth endpoint is a simple user registration without requiring user email (for now), with the password hash method being invoked only to demonstrate insertion into database if its a new user;

```python
@app.route('/api/registration', methods=['POST'])
def registration():
    
    """Register user without validation email, only for test"""

    req = flask.request.get_json(force=True)
    username = req.get('username', None)
    password = req.get('password', None)
    
    with app.app_context():
        db.create_all()
        if db.session.query(User).filter_by(username=username).count() < 1:
            db.session.add(User(
                username=username,
                password=guard.hash_password(password),
                roles='user'
            ))
        db.session.commit()
    
    user = guard.authenticate(username, password)
    ret = {'access_token': guard.encode_jwt_token(user)}

    return ret,200
```

## Run Flask App

```python
# Run
if __name__ == '__main__':
    app.run()
```

## Running Locally

To run your application locally you can use the following command:

`flask run`

## Deploying Application

This application was deployed on **Heroku.**

![heroku](heroku.png)

The deployment is not described in this article. You can check the app up and running [here](https://jwtlogin-app.herokuapp.com/api/).

## Flask-praetorian

To let the things easier Flask-praetorian was used to handle the hard logic by itself. 

![flask-praetorian](flask-praetorian.png)

Among the advantages of using Flask-praetorian in this API (where the most important is undoubtedly allowing to use JWT token for authentication) are:

* Hash passwords for storing in database;
* Verify plaintext passwords against the hashed, stored versions;
* Generate authorization tokens upon verification of passwords;
* Check requests to secured endpoints for authorized tokens;
* Supply expiration of tokens and mechanisms for refreshing them;
* Ensure that the users associated with tokens have necessary roles for access;

You can check Flask-praetorian documentation here: [Flask-praetorian](https://flask-praetorian.readthedocs.io/en/latest/index.html#table-of-contents)

## Frontend Application

For now the ReactJS application (check the repository [here](https://github.com/patriciadourado/jwtlogin-reactjs)) that consumes this Flask API provides three different pages:

1. The `Home page` with the login button (if the user isn't logged) and with the secret button and the logout button (assuming the user is logged);
2. The `Login Page` where the user can log-in;
3. The `Protected page` with a content message that only the logged user can view;

**Note:** You can check the whole jwtlogin flask application code in this** [github repository](https://github.com/patriciadourado/jwtlogin-flask)** and the deployed with ReactJS part on its description link;

Link inspirations:

* [Setting up & Deploying JWT based auth using Flask & React](http://yasoob.me/posts/how-to-setup-and-deploy-jwt-auth-using-react-and-flask/)
* [Flask by Example – Setting up Postgres, SQLAlchemy, and Alembic](https://realpython.com/flask-by-example-part-2-postgres-sqlalchemy-and-alembic/)
* [Building a secure admin interface with Flask-Admin and Flask-Security](https://ckraczkowsky.medium.com/building-a-secure-admin-interface-with-flask-admin-and-flask-security-13ae81faa05)
* [Heroku: Deploy your Flask App with a Database Online](https://medium.com/analytics-vidhya/heroku-deploy-your-flask-app-with-a-database-online-d19274a7a749)
* [Getting Started with Heroku, Postgres and PgAdmin — RUN__ON Part 2](https://medium.com/@vapurrmaid/getting-started-with-heroku-postgres-and-pgadmin-run-on-part-2-90d9499ed8fb)