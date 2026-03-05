## Sprint CI/CD workflow


### Current State
- I have manually assisted by grok ia many aspect of the system in order to deployed to Contabo VPS
- I have encountred many issues
    a. migration fails many times, issue in creating and seeding the db on the server
    b. issue in environment parity dev/production 
    c. issue on vps server (installing bare metal nginx as reverse proxy)


### Objectives
- fix all possible issues in order to achieve CI-CD workflow using Github action tageting Contabo VPS (I will provide ssh credentials and ip)
- refactor all possible code that can generate the db , populate it (indepontent way)
- I you can , ssh on the vps server and fix nginx config, delete the underconstrution app, I will provide paths
