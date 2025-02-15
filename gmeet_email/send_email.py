import smtplib, ssl

hostname = "smtp.cloudmta.net"
username = "f2f731b2f948c506"
password = "1FLqHDpjk7PtvjbDqLAzP2Lj"

message = """\
Subject: Test from Python
To: vladimir@osipov.cc
From: customer@reflectai.dev

Hello, say hi"""

server = smtplib.SMTP(hostname, 2525)
server.ehlo() # Can be omitted
server.starttls(context=ssl.create_default_context()) # Secure the connection
response = server.login(username, password)
print(response)

print(server.sendmail("customer@reflectai.dev", "vladimir@osipov.cc", message))
server.quit