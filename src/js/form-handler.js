(function () {
  document.querySelectorAll(".wpcf7-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var submitBtn = form.querySelector('[type="submit"]');
      var responseOutput = form.querySelector(".wpcf7-response-output");

      if (submitBtn) submitBtn.disabled = true;
      if (responseOutput) {
        responseOutput.textContent = "";
        responseOutput.className = "wpcf7-response-output";
        responseOutput.removeAttribute("aria-hidden");
      }

      var formData = new FormData(form);

      fetch("/api/contact", {
        method: "POST",
        body: formData,
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok && result.data.status === "mail_sent") {
            // Show success message
            if (responseOutput) {
              responseOutput.textContent = result.data.message;
              responseOutput.classList.add("wpcf7-mail-sent-ok");
            }
            // Dispatch event so existing handler in header.njk hides the form
            var event = new CustomEvent("wpcf7mailsent", {
              bubbles: true,
              detail: { contactFormId: formData.get("_wpcf7") },
            });
            form.dispatchEvent(event);
            form.reset();
          } else {
            // Show error
            if (responseOutput) {
              responseOutput.textContent =
                result.data.message || "Something went wrong. Please try again.";
              responseOutput.classList.add("wpcf7-validation-errors");
            }
          }
        })
        .catch(function () {
          if (responseOutput) {
            responseOutput.textContent = "Network error. Please try again.";
            responseOutput.classList.add("wpcf7-validation-errors");
          }
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  });
})();
