package com.airxiechao.oarword;

import java.text.SimpleDateFormat;
import java.util.Date;

public class Ticket {
	public String ip = "";
	public String file = "";
	public String time = "";
	
	Ticket(String i, String f) {
		ip = i;
		file = f;
		
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		time = df.format(new Date());
	}
	
	public String getIp() {
		return ip;
	}
	public void setIp(String ip) {
		this.ip = ip;
	}
	public String getFile() {
		return file;
	}
	public void setFile(String file) {
		this.file = file;
	}
	public String getTime() {
		return time;
	}
	public void setTime(String time) {
		this.time = time;
	}

}
