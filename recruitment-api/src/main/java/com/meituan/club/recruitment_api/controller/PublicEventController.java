package com.meituan.club.recruitment_api.controller;

import com.meituan.club.recruitment_api.common.Result;
import com.meituan.club.recruitment_api.service.EventCheckinService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin
@RestController
@RequestMapping("/api/v1/recruitment/event")
public class PublicEventController {

    @Autowired
    private EventCheckinService eventCheckinService;

    @PostMapping("/start")
    public Result<String> startCheckin(@RequestBody Map<String, Object> req) {
        Long eventId = Long.valueOf(req.get("eventId").toString());
        double lon = Double.parseDouble(req.get("longitude").toString());
        double lat = Double.parseDouble(req.get("latitude").toString());
        String code = eventCheckinService.startEventCheckin(eventId, lon, lat);
        return Result.success("生成签到口令: " + code + " (该口令将在30秒后过期)");
    }

    @PostMapping("/checkin")
    public Result<String> checkin(@RequestBody Map<String, Object> req) {
        try {
            Long eventId = Long.valueOf(req.get("eventId").toString());
            String code = req.get("code").toString();
            double lon = Double.parseDouble(req.get("longitude").toString());
            double lat = Double.parseDouble(req.get("latitude").toString());

            boolean ok = eventCheckinService.checkin(eventId, code, lon, lat);
            if (ok) return Result.success("签到成功！已获取面试加分资格。");
            return Result.error(400, "签到判定失败");
        } catch (IllegalArgumentException e) {
            return Result.error(400, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return Result.error(500, "服务器异常或参数错误");
        }
    }
}
