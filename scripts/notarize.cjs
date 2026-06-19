const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    tool: 'notarytool',
    teamId: "53S3724B9B",
    appBundleId: "com.sia.app",
    appPath: `${appOutDir}/${appName}.app`,
    appleId: "pcrutracks@gmail.com",
    appleIdPassword: "gumb-fmhl-dycl-rgiz"
  });
};
