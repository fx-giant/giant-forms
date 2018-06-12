# Service Check Form
This is a sample GIANT form used for check is all your GIANT backend service confiuration is health or not.

## Components
This form have two parts:
1. **Services** A node.js proxy service which need pass in service url host, port, is ping checking or config checking,need show detail or not flag, after pass in all the information, the service will help call GIANT java backend service to check is the service detail.
2. **From** A GIANT form use for show the service check result.

## How to use
1. **Build Docker Image** 
  Go to service folder

```bash
docker build -t service:latest .
```
2. **Run Service**
```bash
docker run -d -p <your-port>:2727 service:latest
```

3. **Edit you service from package config.jspn file**
```bash
{
  "forms": [{
    "formId": "new-generate-guid",
    "formName": "servicecheck",
    "title": "servicecheck",
    "serviceUrl": "http://<your-server-host>:<your-port>/api/checkservice/",
    "version": "0.0.0"
  }]
}
```
Note: you can generate your GUID [here](https://www.guidgenerator.com/online-guid-generator.aspx)

4. **ZIP your form package and upload to your giant environment**

## How to Mainatain 
1. **Add New Server Module**
- All the java service information get from missioncontrol, so if you add new service to missioncontrol application service you need change service-check-form\servicecheck.js file modelNeedCheck array to add your module name here.
