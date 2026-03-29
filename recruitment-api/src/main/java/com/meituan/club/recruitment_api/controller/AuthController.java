package com.meituan.club.recruitment_api.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.meituan.club.recruitment_api.common.Result;
import com.meituan.club.recruitment_api.entity.SysUser;
import com.meituan.club.recruitment_api.mapper.SysUserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@CrossOrigin
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private SysUserMapper sysUserMapper;

    /**
     * 模拟学校数据库 SSO 登录接口
     * 如果邮箱不存在，则自动注册（模拟直接从校库同步过来）
     */
    @PostMapping("/sso-login")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || email.isEmpty()) {
            return Result.error(400, "请输入学校邮箱");
        }

        QueryWrapper<SysUser> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("school_email", email);
        SysUser user = sysUserMapper.selectOne(queryWrapper);

        if (user == null) {
            // Auto register for demo
            user = new SysUser();
            user.setSchoolEmail(email);
            user.setPassword(password);
            user.setCreateTime(LocalDateTime.now());
            user.setUpdateTime(LocalDateTime.now());
            
            String token = UUID.randomUUID().toString();
            user.setToken(token);
            sysUserMapper.insert(user);
        } else {
            if (!user.getPassword().equals(password)) {
                return Result.error(401, "密码错误");
            }
            String token = UUID.randomUUID().toString();
            user.setToken(token);
            user.setUpdateTime(LocalDateTime.now());
            sysUserMapper.updateById(user);
        }

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("id", user.getId()); // Use 'id' for consistency
        responseData.put("userId", user.getId()); 
        responseData.put("token", user.getToken());
        responseData.put("schoolEmail", user.getSchoolEmail());

        return Result.success(responseData);
    }
}
