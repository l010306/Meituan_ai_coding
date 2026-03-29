with open('src/main/resources/schema.sql', 'r') as f:
    content = f.read()

# Add portfolio_url to student_resume
new_content = content.replace(
    '`structured_data` JSON COMMENT \'AI解析后的技能/经历(例如: {"skills":["java","c++"], "experience":"..."})\',',
    '`structured_data` JSON COMMENT \'AI解析后的技能/经历(例如: {"skills":["java","c++"], "experience":"..."})\',\\n  `portfolio_url` VARCHAR(255) COMMENT \'作品集链接\','
)

with open('src/main/resources/schema.sql', 'w') as f:
    f.write(new_content)
