const welcomeEmail = (firstName) => {
    return `
        <!DOCTYPE html>
<html>

<head>
<meta charset="UTF-8">
<title>Welcome to AfriReadCo</title>
</head>

<body style="margin:0;padding:0;background:#F8F4EC;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F4EC;padding:40px 0;">

<tr>
<td align="center">

<table width="620" cellpadding="0" cellspacing="0"
style="background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #eee;">

<!-- Header -->
<tr>
<td align="center"
style="background:#C65D3B;padding:40px 30px;">

<!-- SVG Logo -->
<svg width="170" height="60" viewBox="0 0 180 60" xmlns="http://www.w3.org/2000/svg">

<g transform="translate(4 8)">
<path
d="M8 36V8c6-4 14-4 20 0v28c-6-4-14-4-20 0Z"
fill="#F8F4EC"
stroke="#F8F4EC"
stroke-width="1.5"/>

<path
d="M28 36V8c6-4 14-4 20 0v28c-6-4-14-4-20 0Z"
fill="#F8F4EC"
stroke="#F8F4EC"
stroke-width="1.5"/>

<line
x1="28"
y1="8"
x2="28"
y2="36"
stroke="#D9A441"
stroke-width="2"/>
</g>

<text
x="60"
y="36"
font-family="Georgia, serif"
font-size="22"
font-weight="700"
fill="#F8F4EC">
Afri<tspan fill="#D9A441">Read</tspan>Co
</text>

</svg>

<p style="margin-top:18px;color:#F8F4EC;font-size:16px;">
Africa's Home for Readers
</p>

</td>
</tr>

<!-- Body -->

<tr>
<td style="padding:45px;">

<h2 style="color:#5A3E2B;margin-top:0;">
Welcome, ${firstName}! 👋
</h2>

<p style="color:#555;font-size:16px;line-height:1.8;">

We're delighted to welcome you to
<strong style="color:#C65D3B;">AfriReadCo</strong>.

You've just joined a growing community of readers passionate about discovering stories, connecting through books, and celebrating African literature.

</p>

<p style="color:#555;font-size:16px;line-height:1.8;">

Here's what you can do next:

</p>

<ul style="color:#555;line-height:2;font-size:15px;padding-left:20px;">

<li> Explore amazing books</li>

<li> Join reading clubs</li>

<li> Share your reviews</li>

<li> Connect with fellow readers</li>

<li> Discover African stories</li>

</ul>

<div style="text-align:center;margin:40px 0;">

<a href=""
style="
background:#C65D3B;
color:white;
text-decoration:none;
padding:15px 35px;
border-radius:8px;
font-weight:bold;
display:inline-block;
">

Start Reading

</a>

</div>

<p style="color:#777;font-size:15px;line-height:1.7;">

Every great journey begins with a single page.

We're excited to be part of yours.

</p>

<p style="margin-top:35px;color:#5A3E2B;font-weight:bold;">

Happy Reading,

<br><br>

The AfriReadCo Team

</p>

</td>
</tr>

<!-- Footer -->

<tr>
<td
align="center"
style="
background:#5A3E2B;
padding:25px;
color:#F8F4EC;
font-size:13px;
">

© ${new Date().getFullYear()} AfriReadCo

<br><br>

Building Africa's most vibrant reading community.

</td>
</tr>

</table>

</td>
</tr>

</table>

</body>

</html>
    `;
};

module.exports = {
    welcomeEmail
};