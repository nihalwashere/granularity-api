const addCSS = (s) =>
  ((d) => {
    d.head.appendChild(d.createElement("style")).innerHTML = s;
  })(document);

const isDark = (color) => {
  if (!color.startsWith("#")) {
    return;
  }
  let currentColor = color;
  const c = currentColor.substring(1);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 255;
  const g = (rgb >> 8) & 255;
  const b = (rgb >> 0) & 255;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < 70;
};

const createFrameElement = (id, params) => {
  const frame = document.createElement("iframe");

  frame.id = params?.containerId
    ? `${params.containerId}-iframe`
    : "granularity-iframe";

  let queryParams = `?hn=${window.location.hostname}`;

  if (params.starterVariables) {
    for (let codeId in params.starterVariables) {
      const value = params.starterVariables[codeId];
      if (value === undefined || value === null) {
        continue;
      }
      queryParams += `&${codeId}=${encodeURIComponent(value)}`;
    }
  }

  const hostQueryParams = document.location.search;

  if (hostQueryParams !== "") {
    queryParams += (queryParams === "" ? "?" : "&") + hostQueryParams.slice(1);
  }

  const url = id.startsWith("https")
    ? `${id}${queryParams}`
    : `https://granularity-app.nihalwashere.xyz/form/${id}`;

  // const url = `http://localhost:3000/form/${id}`  

  if (params.lazy) {
    frame.dataset.src = url;
  } else {
    frame.src = url;
  }

  frame.setAttribute("allowfullscreen", "true");

  frame.referrerPolicy = "origin";

  let backgroundColor = "rgba(255,255,255,0)";

  if (params?.loadingBackgroundColor) {
    backgroundColor = params.loadingBackgroundColor;
  } else if (params?.loadingColors) {
    backgroundColor = params.loadingColors.chatBackground;
  }

  frame.style = `border-radius: inherit; width: 100%; height: 100%; background-color: ${backgroundColor}; border: 0`;

  window.addEventListener("message", (event) => {
    if (event.data.from === "granularity") {
      if (event.data.redirectUrl) {
        window.open(event.data.redirectUrl);
      }
    }
  });

  return frame;
};

const createPopup = (id, params) => {
  const bg = document.createElement("div");

  bg.style =
    "width: 100vw; height: 100vh; background-color: rgba(0,0,0,0.25); position: fixed; z-index: 99999; display: none; justify-content: center; align-items: center";

  const iframeContainer = document.createElement("div");

  iframeContainer.style = `width: 70%; height: 70%; border-radius: 5px; position: relative; max-width: 900px; background-color: ${
    params.loadingBackgroundColor ?? "#ffffff"
  }`;

  const closeButton = document.createElement("button");

  closeButton.setAttribute("aria-label", "Close granularity popup");

  closeButton.style =
    "position: absolute; top: 10px; right: 10px; width: 50px; height: 50px; cursor: pointer; background: none; border: none; outline: none";

  closeButton.innerHTML =
    '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;"><path d="M278.6 256l68.2-68.2c6.2-6.2 6.2-16.4 0-22.6-6.2-6.2-16.4-6.2-22.6 0L256 233.4l-68.2-68.2c-6.2-6.2-16.4-6.2-22.6 0-3.1 3.1-4.7 7.2-4.7 11.3 0 4.1 1.6 8.2 4.7 11.3l68.2 68.2-68.2 68.2c-3.1 3.1-4.7 7.2-4.7 11.3 0 4.1 1.6 8.2 4.7 11.3 6.2 6.2 16.4 6.2 22.6 0l68.2-68.2 68.2 68.2c6.2 6.2 16.4 6.2 22.6 0 6.2-6.2 6.2-16.4 0-22.6L278.6 256z"></path></svg>';

  iframeContainer.appendChild(closeButton);

  const iframe = createFrameElement(id, { ...params, lazy: true });

  iframeContainer.appendChild(iframe);

  bg.appendChild(iframeContainer);

  document.body.style.overflow = "hidden";

  document.body.style.height = "100%";

  const openPopup = (iframe, popup) => {
    if (!iframe.src) {
      iframe.src = iframe.dataset.src;
    }
    popup.style.display = "flex";
  };

  if (params?.delay !== undefined) {
    setTimeout(() => openPopup(iframe, bg), params?.delay ?? 0);
  }

  window.addEventListener("message", (event) => {
    if (event.data.action === "open-granularity-popup") openPopup(iframe, bg);
  });

  bg.addEventListener("click", (evt) => {
    let targetElement = evt.target;

    do {
      if (targetElement == iframeContainer) {
        return;
      }

      targetElement = targetElement.parentNode;
    } while (targetElement);

    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    bg.style.display = "none";
  });

  closeButton.onclick = () => {
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    bg.style.display = "none";
  };

  return bg;
};

const createChat = ({
  id: id,
  buttonColor: buttonColor,
  proactiveMessage: proactiveMessage,
  iconUrl: iconUrl,
  params: params,
}) => {
  addCSS(
    `\n  .sbl-circ {\n    position: absolute;\n    display: inline-block;\n    border: 2px solid;\n    border-radius: 50%;\n    width: 25px;\n    height: 25px;\n    color: #0042DA;\n    border-top-color: transparent;\n    animation: rotate 1s linear infinite;\n  }\n  \n  @keyframes rotate {\n    0% {\n      transform: rotate(0);\n    }\n    100% {\n      transform: rotate(360deg);\n    }\n  }\n  \n  .granularity-chat-icon,\n  .granularity-chat-close {\n    transition: all .35s ease-in-out;\n  }\n\n  .granularity-chat-button.active .granularity-chat-icon{\n    transform: rotate( 90deg ) scale( 0 );\n    opacity: 0;\n  }\n  \n  .granularity-chat-button:not( .active ) .granularity-chat-close{\n    transform: rotate( -90deg ) scale( 0 );\n    opacity: 0;\n  }\n\n  .granularity-iframe-container:not( .active ) {\n    opacity: 0;\n    transform: translate(0, 100px);\n  }\n  .granularity-iframe-container.active {\n    opacity: 1;\n    transform: translate(0, 0);\n  }\n\n  .bubbleCallOut {\n    font-size: 18px;\n    color: #303235;\n    opacity: 0;\n    transform: translate(0, 10px);\n    transition: opacity 500ms ease-out, transform 500ms ease-out;\n    cursor:pointer ;font-weight: 300;\n    bottom: 90px;\n    right:20px;\n    z-index: 99999;\n    position: fixed;\n    max-width: 280px;\n    background-color: white;\n    box-shadow: 0 3px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);\n    padding: 16px;\n    display: flex;\n    align-items: center;\n    border-radius: 8px;\n  }\n\n  .granularity-mobile-footer {\n    display: none;\n  }\n  @media screen and (max-width: 450px) {\n    .bubbleCallOut {\n      max-width: 200px;\n      font-size: 15px;\n      bottom: 70px;\n      right: 10px;\n    }\n\n    .granularity-chat-button {\n      width: 50px !important;\n      height: 50px !important;\n      bottom: 10px !important;\n      right: 10px !important;\n    }\n\n    .granularity-mobile-footer {\n      display: block;\n    }\n  }\n\n  .bubble-typing {\n    transition: width 400ms ease-out, height 400ms ease-out;\n  }\n  \n  .bubble1 {\n    animation: chatBubbles 1s ease-in-out infinite;\n  }\n  \n  .bubble2 {\n    animation: chatBubbles 1s ease-in-out infinite;\n    animation-delay: 0.3s;\n  }\n  \n  .bubble3 {\n    animation: chatBubbles 1s ease-in-out infinite;\n    animation-delay: 0.5s;\n  }\n  \n  @keyframes chatBubbles {\n    0% {\n      transform: translateY(0);\n    }\n    50% {\n      transform: translateY(-5px);\n    }\n    100% {\n      transform: translateY(0);\n    }\n  }\n  `
  );

  const resizeFrame = (container) => {
    if (window.innerWidth <= 800) {
      if ("100%" === container.style.width) return;
      (container.style.width = "100%"),
        (container.style.height = "100%"),
        (container.style.top = 0),
        (container.style.left = 0),
        (container.style.maxHeight = "100%");
    } else {
      if ("400px" === container.style.width) return;
      (container.style.width = "400px"),
        (container.style.maxHeight = "680px"),
        (container.style.left = "auto"),
        (container.style.top = "auto"),
        (container.style.bottom = "90px"),
        (container.style.right = "20px");
      container.style.height = "calc(100% - 160px)";
    }
  };

  const toggleChat = (chatButton, iframeContainer, iframe) => {
    if (!iframe.src) {
      iframe.src = iframe.dataset.src;
      setTimeout(() => {
        loadingComponent.remove();
      }, 500);
      localStorage.setItem("openedChat", "true");
    }

    chatButton.classList.toggle("active");

    iframeContainer.classList.toggle("active");

    if (!iframeContainer.className.includes("active")) {
      setTimeout(() => {
        iframeContainer.style.visibility = "hidden";
      }, 600);
      if (window.innerWidth <= 800) {
        document.body.style.overflow = "auto";
        document.body.style.height = "auto";
      }
    } else {
      iframeContainer.style.visibility = "visible";
      if (window.innerWidth <= 800) {
        document.body.style.overflow = "hidden";
        document.body.style.height = "100%";
      }
    }
  };

  const openChat = (chatButton, iframeContainer, iframe, loadingIcon) => {
    if (!iframe.src) {
      iframe.src = iframe.dataset.src;

      setTimeout(() => {
        loadingComponent.remove();
      }, 500);

      localStorage.setItem("openedChat", "true");
    }

    if (!iframeContainer.className.includes("active")) {
      chatButton.classList.toggle("active");
      iframeContainer.classList.toggle("active");
      iframeContainer.style.visibility = "visible";

      if (window.innerWidth <= 800) {
        document.body.style.overflow = "hidden";
        document.body.style.height = "100%";
      }
    }
  };

  const existingChat = document.getElementById("granularity-chat-container");

  if (existingChat) {
    existingChat.remove();
  }

  const chatContainer = document.createElement("div");

  chatContainer.id = "granularity-chat-container";

  let message;

  let closeMessageButton;

  if (proactiveMessage && proactiveMessage.remember === false) {
    localStorage.removeItem("openedChat");
  }

  if (proactiveMessage && !localStorage.getItem("openedChat")) {
    message = document.createElement("div");
    setTimeout(() => {
      message.style.opacity = "1";
      message.style.transform = "translate(0, 0)";
    }, proactiveMessage.delay);

    message.className = "bubbleCallOut";

    if (proactiveMessage.avatar) {
      const avatarContainer = document.createElement("div");
      avatarContainer.style =
        "margin-right: 8px; width: 40px; height: 40px; flex-shrink:0; display: flex; align-items: flex-end;";
      const avatar = document.createElement("img");
      avatar.src = proactiveMessage.avatar;
      avatar.style = "width: 100%; border-radius: 100%;";
      avatarContainer.appendChild(avatar);
      message.appendChild(avatarContainer);
    }

    message.innerHTML += proactiveMessage.textContent;
    closeMessageButton = document.createElement("button");
    closeMessageButton.setAttribute("aria-label", "Close granularity preview");
    closeMessageButton.style = `position: absolute; top: -15px; right: -7px; width: 30px; height: 30px; background-color: #edf2f7; border-radius: 100%; border: none; outline: none; color:black; padding: 0; cursor:pointer`;
    closeMessageButton.innerHTML =
      '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" style="width: 25px; height: 25px; margin-top: 2px"><path d="M278.6 256l68.2-68.2c6.2-6.2 6.2-16.4 0-22.6-6.2-6.2-16.4-6.2-22.6 0L256 233.4l-68.2-68.2c-6.2-6.2-16.4-6.2-22.6 0-3.1 3.1-4.7 7.2-4.7 11.3 0 4.1 1.6 8.2 4.7 11.3l68.2 68.2-68.2 68.2c-3.1 3.1-4.7 7.2-4.7 11.3 0 4.1 1.6 8.2 4.7 11.3 6.2 6.2 16.4 6.2 22.6 0l68.2-68.2 68.2 68.2c6.2 6.2 16.4 6.2 22.6 0 6.2-6.2 6.2-16.4 0-22.6L278.6 256z"></path></svg>';

    message.append(closeMessageButton);

    chatContainer.prepend(message);
  }

  const chatButton = document.createElement("button");

  chatButton.className = "granularity-chat-button";

  chatButton.style = `padding: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 99999; position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; border-radius: 100%; background-color: ${buttonColor}; box-shadow: 0 1px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 32px 0 rgba(0, 0, 0, 0.16); border: none; outline: none`;

  chatButton.setAttribute("aria-label", "Open granularity chat");

  const logoIcon = document.createElement("div");

  logoIcon.style = "display:flex;";

  logoIcon.className = "granularity-chat-icon";

  if (iconUrl !== "" && iconUrl.startsWith("https")) {
    logoIcon.innerHTML = `<img src="${iconUrl}" style="width: 40px; height: 40px"/>`;
  } else {
    logoIcon.innerHTML =
      '<svg style="width: 32px" height="19px" viewBox="0 0 41 19" fill="none" xmlns="http://www.w3.org/2000/svg" > <rect x="40.29" y="0.967773" width="6.83761" height="30.7692" rx="3.4188" transform="rotate(90 40.29 0.967773)" fill="white"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M3.70884 7.80538C5.597 7.80538 7.12765 6.27473 7.12765 4.38658C7.12765 2.49842 5.597 0.967773 3.70884 0.967773C1.82069 0.967773 0.290039 2.49842 0.290039 4.38658C0.290039 6.27473 1.82069 7.80538 3.70884 7.80538Z" fill="white"/> <rect x="0.290039" y="18.0615" width="6.83761" height="30.7692" rx="3.4188" transform="rotate(-90 0.290039 18.0615)" fill="white"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M36.8712 11.2239C34.9831 11.2239 33.4524 12.7546 33.4524 14.6427C33.4524 16.5309 34.9831 18.0615 36.8712 18.0615C38.7594 18.0615 40.29 16.5309 40.29 14.6427C40.29 12.7546 38.7594 11.2239 36.8712 11.2239Z" fill="white"/> </svg>';
  }

  const closeIcon = document.createElement("div");

  closeIcon.style =
    "position: absolute; display: flex; justify-content: center";

  closeIcon.className = "granularity-chat-close";

  closeIcon.innerHTML =
    '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" style="width: 80%; height: 80%; color: white;" > <path d="M278.6 256l68.2-68.2c6.2-6.2 6.2-16.4 0-22.6-6.2-6.2-16.4-6.2-22.6 0L256 233.4l-68.2-68.2c-6.2-6.2-16.4-6.2-22.6 0-3.1 3.1-4.7 7.2-4.7 11.3 0 4.1 1.6 8.2 4.7 11.3l68.2 68.2-68.2 68.2c-3.1 3.1-4.7 7.2-4.7 11.3 0 4.1 1.6 8.2 4.7 11.3 6.2 6.2 16.4 6.2 22.6 0l68.2-68.2 68.2 68.2c6.2 6.2 16.4 6.2 22.6 0 6.2-6.2 6.2-16.4 0-22.6L278.6 256z" ></path></svg >';

  chatButton.appendChild(logoIcon);

  chatButton.appendChild(closeIcon);

  let loadingColors = {
    chatBackground: "#ffffff",
    bubbleBackground: "rgb(247, 248, 255)",
    typingDots: "rgb(48, 50, 53)",
  };

  if (params?.colors?.loadingBackgroundColor) {
    loadingColors.chatBackground = params.colors?.loadingBackgroundColor;
  } else if (params?.colors?.loadingColors) {
    loadingColors = { ...params.colors.loadingColors };
  }

  const iframeContainer = document.createElement("div");

  iframeContainer.className = "granularity-iframe-container";

  iframeContainer.style = `visibility: hidden; display:flex; flex-direction: column; justify-content: center; align-items: center; z-index: 99999; background-color: ${loadingColors.chatBackground}; border-radius: 10px; position: fixed; transition: opacity 500ms ease-out, transform 500ms ease-out; box-shadow: rgba(0, 0, 0, 0.16) 0px 5px 40px; `;

  const mobileFooter = document.createElement("div");

  mobileFooter.className = "granularity-mobile-footer";

  mobileFooter.style = `height: 70px; background-color: ${loadingColors.chatBackground}; width:100%; flex-shrink: 0; border-radius: 10px;`;

  const loadingComponent = document.createElement("div");

  loadingComponent.className = "sbl-circ";

  loadingComponent.style = `color: ${loadingColors.typingDots}`;

  iframeContainer.appendChild(loadingComponent);

  const iframe = createFrameElement(id, {
    lazy: true,
    ...params,
    loadingColors: loadingColors,
  });

  iframeContainer.appendChild(iframe);

  iframeContainer.appendChild(mobileFooter);

  chatButton.onclick = () => {
    if (message) {
      message.remove();
    }
    toggleChat(chatButton, iframeContainer, iframe, loadingComponent);
  };

  window.addEventListener("message", (event) => {
    if (event.data.action === "open-granularity-chat")
      openChat(chatButton, iframeContainer, iframe);
  });

  if (message) {
    message.onclick = () => {
      message.remove();
      toggleChat(chatButton, iframeContainer, iframe);
    };
    closeMessageButton.onclick = (e) => {
      e.stopPropagation();
      message.remove();
      if (proactiveMessage.remember) {
        localStorage.setItem("openedChat", "true");
      }
    };
  }

  chatContainer.appendChild(iframeContainer);

  chatContainer.appendChild(chatButton);

  resizeFrame(iframeContainer);

  window.onresize = () => {
    resizeFrame(iframeContainer);
  };

  return chatContainer;
};

class Granularity {
  constructor(type) {
    this.type = type;
  }

  open() {
    window.postMessage({
      action:
        this.type === "chat"
          ? "open-granularity-chat"
          : "open-granularity-popup",
    });
  }

  static Fullpage(config) {
    window.addEventListener(
      "load",
      () => {
        document.body.append(
          createFrameElement(config.formId, {
            loadingBackgroundColor: config?.loadingBackgroundColor,
            starterVariables: config?.starterVariables,
          })
        );
      },
      false
    );
    return new Granularity();
  }

  static Container(config) {
    const granularityContainer = document.querySelector(
      `#${config.containerId}`
    );

    if (!document.querySelector(`#${config.containerId}-iframe`)) {
      granularityContainer.appendChild(
        createFrameElement(config.formId, {
          loadingBackgroundColor: config?.loadingBackgroundColor,
          starterVariables: config?.starterVariables,
          lazy: true,
          containerId: config?.containerId,
        })
      );
    }

    const observer = new IntersectionObserver(
      function (entries) {
        if (entries.pop()?.isIntersecting === true) {
          const iframe = document.querySelector(
            `#${config.containerId}-iframe`
          );

          if (!iframe.dataset.src) return;

          iframe.src = iframe.dataset.src;

          iframe.removeAttribute("data-src");
        }
      },
      { threshold: [0] }
    );

    observer.observe(granularityContainer);

    return new Granularity();
  }

  static Popup(config) {
    const prependPopup = () => {
      document.body.prepend(
        createPopup(config.formId, {
          loadingBackgroundColor: config?.loadingBackgroundColor,
          starterVariables: config?.starterVariables,
          delay: config?.delay,
        })
      );
    };

    if (document.readyState === "complete") {
      prependPopup();
    } else {
      window.addEventListener("load", prependPopup, false);
    }

    return new Granularity("popup");
  }

  static Chat(config) {
    const prependChat = () =>
      document.body.prepend(
        createChat({
          id: config.formId,
          buttonColor: config.buttonColor,
          proactiveMessage: config.proactiveMessage ?? null,
          iconUrl: config.buttonIconUrl ?? "",
          params: {
            starterVariables: config?.starterVariables,
            colors: {
              loadingBackgroundColor: config?.loadingBackgroundColor,
              loadingColors: config?.loadingColors,
            },
          },
        })
      );

    if (document.readyState === "complete") {
      prependChat();
    } else {
      window.addEventListener("load", prependChat, false);
    }

    return new Granularity("chat");
  }

  remove() {
    document.getElementById("granularity-chat-container").remove();
  }
}
