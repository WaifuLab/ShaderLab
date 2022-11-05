# Backend design

## language Specification

| Module | Specification |
|:------:|:-------------:|
| server |   CommonJs    |

Choose common js because of the better echo system. Use ESM will cause error in some automatic build tools.

## Basic set up

### token design
 
To avoid anonymity visit on a heavy api, such as two table select by union or join and update large blob assets would
be quite dangerous. jwt with simple info could limit visits.

Token design:

| Data | Datatype |   Usage   |
|------|:--------:|:---------:|
| id   |  number  |  User Id  |

Weakness: When a token expired, api will directly decline user request. Here we designed a two layer authentication to
improve user experience.

```mermaid
sequenceDiagram
    participant client
    participant server
    participant storage
   
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
            server ->> storage: add refresh token
            storage -->> server: response with refresh token or error
            server -->> client: resfresh {state, new token}
        end
        server -->>- client: appropriate response
    else is invalid token
        server -->> client: 404 meessage
        client -->> client: clean token data & refresh page
    end

    opt Signout
        client ->>+ server: /api/user/singout
        server ->> storage: remove storage
        server -->>- client: response
        client -->> client: clean token data & refresh page
    end
```

### user permission

|          | Admin | User | Visitor |
|:---------|:-----:|:----:|:-------:|
| /admin/* |   X   |      |         |
| /api/*   |   X   |  X   |    X    |
| /*       |   X   |  X   |    X    |    

- admin -> /api*, /admin*
- user -> /api*
- visitor -> /* exclude /admin* and /api/*

3 level design would be good enough to.

```mermaid
graph LR;
    Visitor --> User --> Admin
```

### Structure design

```mermaid
sequenceDiagram
    participant model
    participant handle
    participant middle
    participant routes
    routes -->> middle: no token (delined)
    routes ->> middle: vertify or login
    middle ->> handle: request to valid data 
    handle ->> model: query from model
    model -->> handle: error or json
    handle -->> routes: update token?
    handle -->> routes: error handle and resoponse
```

```mermaid
graph TD;
    ModelHandle ----> Mysql
    SearchHandle --> UserHandle
    SearchHandle --> PostHandle
    SearchHandle --> TagHandle
    SearchHandle --> TopicHandle
    UserHandle ---> User
    PostHandle --> TagHandle
    PostHandle --> TopicHandle
    PostHandle ---> Post
    TagHandle --> Tag
    TopicHandle --> Topic
```

```mermaid
graph LR;
    ControllerStart --> Validator --> Handle --> HandleError --> ValidatorError --> ControllerEnd  
    Validator -.-> ValidatorError
    Handle -.-> HandleError -.-> ControllerEnd
```

```mermaid
graph TD;
    UserAPI --> UserController --> UserHandle
    PostAPI --> PostController --> PostHandle
    TagAPI --> TagController --> TagHandle
    TopicAPI --> TopicController --> TopicHandle
    SearchAPI --> SearchController --> SearchHandle
```

```mermaid
sequenceDiagram
    participant req
    participant controller
    participant handle
    participant res
    req ->> controller: params is valid
    validator -->> res: throw and catch error
    validator ->> handle: deal with the safe data
    handle -->> controller: check the data type safe
    handle ->> res: return back the same data
    validator -->> res: throw and catch erro
```
