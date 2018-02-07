### What is this 
        This is a sample GIANT form used for check is all your GIANT backend service confiuration is correct or not.
### Components
    This form have two parts:
#####  Services
        A node.js proxy service which need pass in service url host, port, is ping checking or config checking,need show detail or not flag, after pass in all the information, the service will help call GIANT java backend service to check is the service detail.
##### From
    A GIANT form use for show the service check result.

### How to use
        Before use this you need a server to hold the service. I already build the service as a docker image and push to our docker registory and you pull from there, or you also can you the docker file in the service package and build the docker image by youself, afer you have the image you can use docker run command to run the service as docker container.

        After the service run success you need change the form package config.jason file, the file have two place need need to change. First, you must change the formId to a new GUID, and change the ServiceUrl to you server ip one the file should look like "http://your-host:your-port/api/checkservice/"

        After this latest step you need make the form package as and zip file and upload it to your GIANT evironment, and must make sure you GIANT environment have access to connect to you service server.

        After all the step you can use the service check form alrady,after you view the form and click the execute button you will see all the GIANT java service detail show as JSON format.

### How to Mainatain 

        All the need check java service url are get from missioncontrol so if have new service need check you need add your service dType to servicecheck.js modelNeedCheck array after this all teh things can run already.