package com.meituan.club.recruitment_api;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.meituan.club.recruitment_api.mapper")
public class RecruitmentApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(RecruitmentApiApplication.class, args);
	}

}
