# Auth API

## Analyze

The auth apis provided regular auth and third party auth. The regular auth will do the **signin** (_POST_),
**signup** (_POST_), **reset** (_PUT_) action and get a token in three different action. The third party
auth will get a token, authorization persistence should handle with third party oauth2.0 provider.  

Auth table should require **auth_id**, **auth_name** **auth_email**, **auth_token**, **auth_type**(local,
sns etc,). In github, user contain two different method, user could show auth email(bind with third party)
or github email `balabalabala@users.noreply.github.com`. Here we want to do the same thing, but leave the
local email empty.

## Procedure

### Local Auth

```mermaid
sequenceDiagram
    participant client
    participant server
    participant database
   
    client ->>+ server: /api/user/singin {account, password}
    server ->> server: generate token by jwt
    Note right of client: singup
    server -->>- client: response with token

    client ->> server: Request /api/*
    
    alt is valid token
        client ->>+ server: add token under Authorization header
        alt is safe time
            server ->> server: vertify
        else is unsafe time
            server ->> database: add refresh token
            database -->> server: response with refresh token or error
            server -->> client: resfresh {state, new token}
        end
        server -->>- client: appropriate response
    else is invalid token
        server -->> client: 404 meessage
        client -->> client: clean token data & refresh page
    end

    opt Signout
        client ->>+ server: /api/user/singout
        server ->> database: remove token
        server -->>- client: response
        client -->> client: clean token data & refresh page
    end
```

### Third Party Auth

```mermaid
sequenceDiagram
    participant client
    participant server
    participant sns
    server ->> sns: Redirect to sns
    sns ->> client: Require user login and permission
    client ->> sns: user's secrect
    sns -->> server: Redirect back to server and a code
    server ->> sns: use code and request a token
    sns -->> server: token
    server ->> sns: user's data
    sns ->> server: data
    server ->> client: recalculated data
```

GitHub configuration steps:

1. Login to **[GitHub](https://github.com/)**.
2. Settings => Developer settings => OAuth Apps => Register a new application
3. Configure follows GitHub guidance and get **Client-ID** and **Client-Secret**

Combine url together and redirect for user

```
REFERER
https://github.com/login/oauth/authorize?
    scope=user:email&
    client_id={Client-ID}&
    redirect_uri={ShaderLab-API}
```

Then, user will do something and get a **Code** from GitHub

```
http://{ShaderLab-API}?code=BALABALABALA
```

which will handle in auth api at _ctx.request.query.code;_

Require token from GitHub

```
POST
https://github.com/login/oauth/access_token?
    client_id={Client-ID}&
    client_secret={Client-Secret}&
    code=${Code}
headers: {
  accept: "application/json"
}
```

and get a **accessToken** from GitHub

Then get email _username@github.com_ from GitHub

```
GET
https://api.github.com/user
headers: {
    accept: "application/json",
    Authorization: `token ${accessToken}`
}
```

Google configuration steps:

1. Login to **[Google](https://console.cloud.google.com)**.
2. Left navbar => API and services => OAuth consent screen
3. Configure follows Google guidance and get **Client-ID** and **Client-Secret**

**Special way**: use Google's [library](https://developers.google.com/identity/protocols/oauth2/web-server#node.js_1)

Combine url together and redirect for user
[official guidance](https://developers.google.com/identity/protocols/oauth2/web-server#creatingclient)

```
REFERER
https://accounts.google.com/o/oauth2/v2/auth?
    scope=https://www.googleapis.com/auth/userinfo.email&
    include_granted_scopes=true&
    response_type=token&
    redirect_uri={ShaderLab-API}&
    client_id={Client-ID}
```

Then, user will do something and get a **Code** from Google

```
http://{ShaderLab-API}?code=BALABALABALA
```

which will handle in auth api at _ctx.request.query.code;_

Require token from Google

```
POST
https://oauth2.googleapis.com/token?
    client_id={Client-ID}&
    client_secret={Client-Secret}&
    code=${Code}&
    grant_type=authorization_code
headers: {
  accept: "application/json"
}
```

and get a **accessToken** from Google

```
GET
https://www.googleapis.com/oauth2/v2/userinfo
headers: {
    accept: "application/json",
    Authorization: `Bearer ${accessToken}`
}
```
