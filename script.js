function htmlContent(content = "") {
  return content
    .replace(
      /^### (.*$)/gim,
      '<h3 style="font-size: 1.5em; color: #333;">$1</h3>'
    )
    .replace(
      /^## (.*$)/gim,
      '<h2 style="font-size: 1.8em; color: #444;">$1</h2>'
    )
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 2em; color: #555;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<b style="font-weight: bold;">$1</b>')
    .replace(/\*(.*?)\*/gim, '<i style="font-style: italic;">$1</i>')
    .replace(/\r\n|\r|\n/gim, "<br>")
    .replace(
      /\[([^\[]+)\]\(([^)]+)\)/gim,
      '<a target="_blank" style="text-decoration: underline; color: #3f51b5;" href="$2">$1</a>'
    )
    .replace(/^\* (.*)$/gim, '<li style="margin-bottom: 0.5em;">$1</li>')
    .replace(
      /^\*{3} (.*)$/gim,
      '<ul style="list-style-type: disc; padding-left: 1.5em;"><li style="margin-bottom: 0.5em;">$1</li></ul>'
    );
}
async function startChatBox() {
  if (document.getElementById("rispose-chat-widget-container")) return;
  const widget_id = window.risposeWidgetId;
  if (!widget_id) return;
  const baseUrl = `https://rispose.com/api/v1/chat/${widget_id}`,
    {
      name: name,
      assistant_id: assistant_id,
      tk: tk,
      welcome: givenWelcome,
      type: type,
      bg_color: givenBgColor,
      text_color: text_color,
    } = await fetch(baseUrl)
      .then((r) => r.json())
      .catch((e) => {
        throw new Error(`Can't load ${baseUrl}`);
      }),
    welcome = givenWelcome || "Hey there",
    bg_color = givenBgColor || "#4f46e5",
    ls_thread_id_key = `rispose_thread_id_${assistant_id}`,
    ls_history_key = `rispose_chat_history_${assistant_id}`;
  let thread_id = localStorage?.getItem(ls_thread_id_key) || null;
  const chatWidgetContainer = document.createElement("div");
  (chatWidgetContainer.id = "rispose-chat-widget-container"),
    document.body.appendChild(chatWidgetContainer);
  const shadow = chatWidgetContainer.attachShadow({ mode: "open" }),
    style = document.createElement("style");
  (style.textContent = `\n        :host {\n            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";\n            position: fixed;\n            bottom: 20px;\n            right: 20px;\n            display: flex;\n            flex-direction: column;\n            z-index: 100;\n        }\n\n        button {\n            background-color: ${bg_color}; \n            border: none;\n        }\n\n        #rispose-chat-popup {\n            height: 70vh;\n            max-height: 70vh;\n            transition: all 0.3s;\n            overflow: hidden;\n            position: absolute; \n            bottom: 5rem; \n            right: 0; \n            width: 24rem; \n            background-color: #ffffff; \n            border-radius: 0.375rem; \n            box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1); \n            display: flex; \n            flex-direction: column; \n            transition: all 0.3s ease-in-out; \n            font-size: 0.875rem;\n        }\n\n        @media (max-width: 768px) {\n            #rispose-chat-popup {\n                position: fixed;\n                top: 0;\n                right: 0;\n                bottom: 0;\n                left: 0;\n                width: 100%;\n                height: 100%;\n                max-height: 100%;\n                border-radius: 0;\n            }\n        }\n\n        #rispose-chat-bubble {\n            width: 4rem; \n            height: 4rem; \n            background-color: ${bg_color}; \n            color: white;\n            border-radius: 50%; \n            display: flex; \n            justify-content: center; \n            align-items: center; \n            cursor: pointer; \n            font-size: 1.875rem; \n        }\n\n        #rispose-chat-header {\n            display: flex; \n            justify-content: space-between; \n            align-items: center; \n            padding: 1rem; \n            background-color: ${bg_color}; \n            color: #ffffff; \n        }\n\n        #rispose-chat-submit {\n            background-color: ${bg_color};\n            color: white;\n            border-radius: 0.375rem;\n            padding-left: 1rem;\n            padding-right: 1rem;\n            padding-top: 0.5rem;\n            padding-bottom: 0.5rem;\n            cursor: pointer;\n        }\n          \n        #rispose-chat-submit:disabled {\n            opacity: 0.5;\n            cursor: not-allowed;\n        }\n\n        #rispose-chat-messages {\n            flex: 1;\n            padding: 1rem;\n            overflow-y: auto;\n        }\n\n        #rispose-chat-input-container {\n            padding: 1rem;\n            border-top: 1px solid #d1d5db;\n            background-color: #F8F8FF;\n        }\n\n        #rispose-chat-input {\n            flex: 1;\n            border: 1px solid #d1d5db;\n            border-radius: 0.375rem;\n            padding-left: 1rem;\n            padding-right: 1rem;\n            padding-top: 0.5rem;\n            padding-bottom: 0.5rem;\n            outline: none;\n            width: 75%;\n        }\n\n        #rispose-chat-clear {\n            border: none;\n            background-color: transparent;\n        }\n    `),
    shadow.appendChild(style);
  const chatContainer = document.createElement("div");
  (chatContainer.innerHTML = `\n        <div id="rispose-chat-bubble">\n            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path fill="currentColor" d="M11 18h2v-2h-2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5c0-2.21-1.79-4-4-4"/></svg>\n        </div>\n        <div id="rispose-chat-popup" style="display:none">\n            <div id="rispose-chat-header">\n                <h3 style="margin: 0; font-size: 1.125rem;">${name}</h3>\n                <button id="rispose-close-popup" style="background-color: transparent; border: none; color: #ffffff; cursor: pointer;">\n                    <svg xmlns="http://www.w3.org/2000/svg" style="width: 1.5rem; height: 1.5rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">\n                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />\n                    </svg>\n                </button>\n            </div>\n            <div id="rispose-chat-messages"></div>\n            <div id="rispose-chat-input-container">\n                <div style="display: flex; justify-content: space-between; align-items: center; gap: 5px;">\n                    <input type="text" id="rispose-chat-input" placeholder="Type your message...">\n                    <button id="rispose-chat-submit">Send</button>\n                    <button id="rispose-chat-clear">\n                        <svg xmlns="http://www.w3.org/2000/svg" style="height:2rem; color:#DEB887; width:auto" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">\n                            <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />\n                        </svg>\n                    </button>\n                </div>\n                <div style="display: flex; text-align: center; font-size: 0.75rem; padding-top: 0.75rem;">\n                    <span style="flex: 1;color: #141414;">AI Customer Support âš¡ï¸ <a href="https://rispose.com?utm_source=widget&utm_medium=${encodeURIComponent(
    window.location.href
  )}" target="_blank" style="color: #7f9cf5;">Rispose.com</a> âš¡ï¸ </span>\n                </div>\n            </div>\n        </div>\n    `),
    shadow.appendChild(chatContainer);
  const chatInput = shadow.getElementById("rispose-chat-input"),
    chatSubmit = shadow.getElementById("rispose-chat-submit"),
    chatClear = shadow.getElementById("rispose-chat-clear"),
    chatMessages = shadow.getElementById("rispose-chat-messages"),
    chatBubble = shadow.getElementById("rispose-chat-bubble"),
    chatPopup = shadow.getElementById("rispose-chat-popup"),
    closePopup = shadow.getElementById("rispose-close-popup");
  chatInput.addEventListener("keyup", (event) => {
    "Enter" === event.key && chatSubmit.click();
  }),
    chatSubmit.addEventListener("click", () => {
      const message = chatInput.value.trim();
      message &&
        ((chatMessages.scrollTop = chatMessages.scrollHeight),
        (chatInput.value = ""),
        onUserRequest(message));
    }),
    chatClear.addEventListener("click", () => {
      (chatMessages.innerHTML = ""),
        (chatMessages.scrollTop = chatMessages.scrollHeight),
        localStorage?.removeItem(ls_thread_id_key),
        localStorage?.removeItem(ls_history_key),
        (thread_id = null),
        (chatSubmit.disabled = !1),
        addMessage(welcome, "assistant", !0);
    }),
    chatBubble.addEventListener("click", () => togglePopup()),
    closePopup.addEventListener("click", () => togglePopup());
  const togglePopup = () => {
      "none" === chatPopup.style.display
        ? ((chatPopup.style.display = "flex"),
          shadow.getElementById("rispose-chat-input").focus())
        : (chatPopup.style.display = "none");
    },
    addMessage = (content, role, skip_history = !1) => {
      const random_reply_id = `${role}_reply_${(Math.random() + 1)
          .toString(36)
          .substring(2)}`,
        messageElement = document.createElement("div"),
        colors =
          "user" === role
            ? `background-color: ${bg_color}; color: #ffffff;`
            : "background-color: #edf2f7; color: #000000;",
        flx =
          "user" === role
            ? "justify-content: flex-end;"
            : "justify-content: flex-start";
      return (
        (messageElement.style = `display: flex; margin-bottom: 0.75rem; ${flx}`),
        (messageElement.innerHTML = `\n\t\t\t<div id="${random_reply_id}" style="${colors} border-radius: 0.5rem; padding-top: 0.5rem; padding-bottom: 0.5rem; padding-left: 1rem; padding-right: 1rem; max-width: 70%;">\n\t\t\t\t${htmlContent(
          content
        )}\n\t\t\t</div>\n\t\t`),
        chatMessages.appendChild(messageElement),
        (chatMessages.scrollTop = chatMessages.scrollHeight),
        (chatInput.value = ""),
        skip_history || addHistory(content, role),
        random_reply_id
      );
    },
    onUserRequest = (content) => {
      addMessage(content, "user"), reply(content);
    },
    reply = (content) => {
      chatSubmit.disabled = !0;
      const random_reply_id = addMessage("...", "assistant", !0),
        body = JSON.stringify({
          content: content,
          assistant_id: assistant_id,
          thread_id: thread_id,
          tk: tk,
        });
      fetch(baseUrl, {
        method: "POST",
        body: body,
        headers: { "Content-Type": "application/json" },
      })
        .then(async (resp) => {
          if (!resp.ok) throw resp;
          const reader = resp.body.getReader(),
            decoder = new TextDecoder("utf-8");
          let msg = "";
          try {
            let safety_loop_breaker = 0;
            for (; safety_loop_breaker < 1e3; ) {
              safety_loop_breaker++;
              const { value: value, done: done } = await reader.read();
              if (done) break;
              const lines = decoder
                .decode(value)
                .toString()
                .split("\n")
                .filter((line) => "" !== line.trim());
              let full_json = "";
              for (let line of lines) {
                if (line.startsWith("event: ")) continue;
                const message = line.replace(/^data: /, "");
                if ("[DONE]" === message) break;
                if (
                  ((full_json += message),
                  full_json.startsWith("{") && full_json.endsWith("}"))
                ) {
                  const json = JSON.parse(message);
                  json?.thread_id &&
                    (localStorage?.setItem(ls_thread_id_key, json.thread_id),
                    (thread_id = json.thread_id)),
                    (msg += json?.delta?.content?.[0]?.text?.value ?? ""),
                    msg.length &&
                      (shadow.getElementById(random_reply_id).innerHTML =
                        htmlContent(msg.replace(/ã€.*?â€ sourceã€‘/g, "")));
                }
              }
            }
            msg.length && addHistory(msg, "assistant");
          } finally {
            reader.cancel("Streaming ended and we don't need it anymore");
          }
        })
        .catch(async (e) => {
          const err = "function" == typeof e.json ? await e.json() : e;
          alert(err?.data?.error?.message || e?.statusMessage || e?.message);
        })
        .finally(() => {
          chatSubmit.disabled = !1;
        });
    },
    addHistory = (content, role) => {
      const history = fetchHistory();
      history.push({ content: content, role: role }),
        localStorage?.setItem(ls_history_key, JSON.stringify(history));
    },
    fetchHistory = () =>
      JSON.parse(localStorage?.getItem(ls_history_key) || "[]"),
    history = fetchHistory();
  for (const msg of history) addMessage(msg.content, msg.role, !0);
  history.length || addMessage(welcome, "assistant", !0);

  togglePopup();
}
startChatBox();