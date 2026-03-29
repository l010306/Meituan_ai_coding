package com.meituan.club.recruitment_api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.geo.*;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class EventCheckinService {

    @Autowired
    private StringRedisTemplate redisTemplate;

    private static final String GEO_KEY = "event:locations";
    private static final String DYNAMIC_CODE_PREFIX = "event:code:";

    /**
     * 社团管理者：生成活动的签到码并设置坐标
     */
    public String startEventCheckin(Long eventId, double longitude, double latitude) {
        // 保存活动坐标
        redisTemplate.opsForGeo().add(GEO_KEY, new Point(longitude, latitude), String.valueOf(eventId));
        
        // 生成动态码，有效期30秒 (供大屏幕展示)
        String code = String.valueOf((int)((Math.random() * 9 + 1) * 100000));
        redisTemplate.opsForValue().set(DYNAMIC_CODE_PREFIX + eventId, code, 30, TimeUnit.SECONDS);
        return code;
    }

    /**
     * 学生：进行签到
     */
    public boolean checkin(Long eventId, String code, double longitude, double latitude) {
        // 1. 校验动态码
        String validCode = redisTemplate.opsForValue().get(DYNAMIC_CODE_PREFIX + eventId);
        if (validCode == null || !validCode.equals(code)) {
            throw new IllegalArgumentException("验证码无效或已过期");
        }

        // 2. 校验地理围栏 (100米内)
        Point studentLocation = new Point(longitude, latitude);
        Metric metric = RedisGeoCommands.DistanceUnit.METERS;
        Circle circle = new Circle(studentLocation, new Distance(100, metric)); 
        
        RedisGeoCommands.GeoRadiusCommandArgs args = RedisGeoCommands.GeoRadiusCommandArgs.newGeoRadiusArgs()
                .includeDistance().sortAscending();
        GeoResults<RedisGeoCommands.GeoLocation<String>> results = redisTemplate.opsForGeo().radius(GEO_KEY, circle, args);
        
        if (results != null) {
            for (GeoResult<RedisGeoCommands.GeoLocation<String>> result : results) {
                if (result.getContent().getName().equals(String.valueOf(eventId))) {
                    return true;
                }
            }
        }
        throw new IllegalArgumentException("距离宣讲会过远，无法完成签到");
    }
}
