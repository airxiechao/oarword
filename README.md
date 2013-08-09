oarword
=======

A javascript doc/docx editor in browser

1.component
  oarword-js: js files, should put into WEBROOT
  oarword-java: servlets, depend jars download at http://pan.baidu.com/share/link?shareid=327061688&uk=2432909170
    includs: docx4j-2.8.1,fileupload-1.3,httpclient4.2.5,dom4j-1.6.1,gson-2.2.4,jodconverter(modified)-3b4,pdfbox-1.8.2
  libreoffice 4: run as service
    start command: soffice -headless -accept="socket,host=127.0.0.1,port=8100;urp;" -nofirststartwizard
    stop command: soffice -headless -unaccept="socket,host=127.0.0.1,port=8100;urp;" -nofirststartwizard
    
2.config server path
  js config:  oarword-js/js/config.js
  java config: oarword-java/src/com/airxiechao/oarword/Config.java
  
3.run

4.contact
  Email: airxiechao@gmail.com
