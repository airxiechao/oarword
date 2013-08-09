oarword
=======

A Javascript Doc/Docx Editor in Browser

1.Component

  1.1 oarword-js: js files, should put into WEBROOT
  
  1.2 oarword-java: servlets
    
    1.2.1 depend jars download: http://pan.baidu.com/share/link?shareid=327061688&uk=2432909170
    
    1.2.2 includs: docx4j-2.8.1,fileupload-1.3,httpclient4.2.5,dom4j-1.6.1,gson-2.2.4,jodconverter(modified)-3b4,pdfbox-1.8.2
 
  1.3 libreoffice 4: run as service

    1.3.1 start command: soffice -headless -accept="socket,host=127.0.0.1,port=8100;urp;" -nofirststartwizard

    1.3.2 stop command: soffice -headless -unaccept="socket,host=127.0.0.1,port=8100;urp;" -nofirststartwizard
    

2.Config

  2.1 js config:  oarword-js/js/config.js
  
  2.2 java config: oarword-java/src/com/airxiechao/oarword/Config.java
  
3.Run

4.Contact

  Email: airxiechao@gmail.com
