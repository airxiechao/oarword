[2019.12.15] :bowtie:**oarword2 is under  construction... see  https://github.com/airxiechao/oarword2**

oarword
=======

A Javascript Doc/Docx Editor (Support Chrome only!)

1.Component

  1.1 oarword-js: static files
  
  1.2 oarword-java: servlets
    
    1.2.1 dependent jars download: http://pan.baidu.com/share/link?shareid=327061688&uk=2432909170
    
    1.2.2 includs: docx4j-2.8.1,fileupload-1.3,httpclient4.2.5,dom4j-1.6.1,gson-2.2.4,jodconverter(modified)-3b4,pdfbox-1.8.2
 
  1.3 libreoffice 4: sudo apt install libreoffice, then run as service

    1.3.1 start command: sudo soffice -headless -accept="socket,host=127.0.0.1,port=8100;urp;" -nofirststartwizard

    1.3.2 stop command: sudo soffice -headless -unaccept="socket,host=127.0.0.1,port=8100;urp;" -nofirststartwizard
    

2.Config

    2.1 js config:  oarword-js/js/config.js
  
    2.2 java config: oarword-java/src/config.properties
    

3.Deploy

    3.1 create 'oarword' directory as WEBROOT

    3.2 copy files in 'oarword-js' into 'oarword'

    3.3 copy 'WEB-INF' and 'META-INF' in 'oarword-java' into 'oarword'

    3.4 build oarword-java's project with jars in 'oarword-depend-lib.zip' and 'servlet-api.jar' and copy 'build/classes' into 'oarword/WEB-INF'

    3.5 unzip 'oarword-depend-lib.zip' and copy 'lib' into 'oarword/WEB-INF'

    3.6 create directory 'upload' and 'tmp' in 'oarword', make sure these directories are writable
    
    3.7 deploy 'oarword' in Tomcat8
  
    3.8 install Chinese fonts, 如果使用中文字体, 需要在服务器端安装中文字体。将字体拷贝到/usr/share/fonts/msfonts, sudo fc-cache -fv
  
4.Run

5.Contact

  Email: airxiechao@qq.com

2013.6
