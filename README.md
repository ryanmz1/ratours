# Ratours WebAPI

RESTful WebAPI serves for Ratours.

- 📕 | [Ratours API Document](https://d32e81bser4zmg.cloudfront.net/)

## Architecture

![Ratours](https://public-bucket-ryan1329.s3.ap-northeast-2.amazonaws.com/wilmon/ratours+(1).png 'Ratours')

```
- src
  - models
  - routes
  - handlers
    - authController
    - errHandler
    - handlerFactory
  - utils
    - apiFeatures
    - emailHelper
    - redisHelper

```

## Dependencies

```
express   ^4.16.4
mongoose  ^5.5.2
redis     ^4.0.0
```
