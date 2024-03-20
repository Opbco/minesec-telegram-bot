const isElementVisible = async (page, selector) => {
  return await page.evaluate((selector) => {
    var e = document.querySelector(selector);
    if (e) {
      var style = window.getComputedStyle(e);

      return (
        style &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0"
      );
    } else {
      return false;
    }
  }, selector);
};

async function getMinfopraDossiers(name_matricule) {
  const criteria = name_matricule.slice(
    name_matricule.lastIndexOf("minfopra") + 9
  );

  try {
    if (!isBusy) {
      isBusy = true;

      var myInputIsVisible = await isElementVisible(page, "#code_dossier");

      if (!myInputIsVisible) page.reload();

      await page.waitForSelector("#code_dossier", { visible: true });

      const input_ = await page.$("#code_dossier");

      await Promise.all([
        await input_.click({ clickCount: 3 }),
        await page.keyboard.press("Backspace"),
        await input_.type(criteria.trim()),
        await page.keyboard.press("Enter"),
      ]);

      await page.waitForSelector("table.table_dossier_ajax", {
        visible: true,
      });

      let trs = await page.evaluate(() => {
        return Array.from(
          document.querySelectorAll("table.table_dossier_ajax>tbody>tr"),
          (tr) => {
            const tds = tr.innerText.trim().split("\t");
            return `code dossier : ${tds[0]} \n date enreg : ${tds[1]} \n nom complet : ${tds[2]} \n objet: ${tds[3]} \n poste detenteur : ${tds[4]} \n status: ${tds[5]} \n matricule: ${tds[6]} \n acte: ${tds[7]} \n date_signature: ${tds[8]}`;
          }
        );
      });
      isBusy = false;
      if (trs?.length > 0) {
        return trs.join("\n\n");
      } else {
        return `Aucun dossier pour *${criteria.trim()}* sur la plateforme dossier.minfopra.cm`;
      }
    } else {
      isBusy = false;
      return "Too many requests, server currently busy. please try again in a while";
    }
  } catch (error) {
    console.log(error);
    isBusy = false;
    return "Too many requests, server currently busy. please try again in a while";
  }
}

module.exports = {
  getMinfopraDossiers,
};
