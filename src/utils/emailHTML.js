module.exports = (authCode) => {
    return `<!DOCTYPE html>
            <html lang="kr">
            <head>
                <meta charset="UTF-8">
                <title>EmailCode</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    main {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 600px;
                        height: 522px;
                        margin: 0 auto;
                        box-sizing: border-box;
                    }
                    #wrapper {
                        padding-left: 10px;
                    }
                    #header {
                        background-color: #505BDA;
                        width: 100%;
                        height: 3px;
                        margin-bottom: 60px;
                    }
                    #wrapper > h1 {
                        display: block;
                        width: 416px;
                        height: 38px;
                        font-size: 30px;
                        margin-bottom: 70px;
                    }
                    #first {
                        margin-bottom: 30px;
                    }
                    #second {
                        margin-bottom: 70px;
                    }
                    #code {
                        width: 151px;
                        height: 44px;
                        margin-bottom: 70px;
                    }
                    #code > h1 {
                        font-size: 44px;
                        color: #505bda;
                        height: 100%;
                        line-height: 44px;
                    }
                    #footer {
                        width: 100%;
                        height: 2px;
                        background-color: #bcbcbc;
                        margin-bottom: 20px;
                    }
                    p {
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <main>
                    <div id="header"></div> 
                    <div id="wrapper">
                        <h1>Squeaker 회원가입 인증번호</h1>
                        <div id="content">
                            <div id="first">
                                <p>안녕하세요. 작은 SNS, Squeaker입니다.</p>
                                <p>Squeaker를 이용해 주셔서 진심으로 감사드립니다.</p>
                            </div>
                            <div id="second">
                                <p>아래의 인증번호를 진행 중인 회원가입 인증번호란에 입력해 주세요.</p>
                                <p>감사합니다.</p>
                            </div>
                            <div id="code">
                                <h1>${authCode}</h1>
                            </div>
                        </div>
                        <div id="footer"></div>
                        <span>발송기준일: ${new Date().toLocaleDateString()}</span>
                    </div>
                </main>
            </body>
            </html>`
}