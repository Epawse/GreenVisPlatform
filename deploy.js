const { NodeSSH } = require("node-ssh");
const path = require("path");
const fs = require("fs");

const ssh = new NodeSSH();

const localDistPath = path.join(__dirname, "dist");
const remoteDistPath =
  "/opt/1panel/apps/openresty/openresty/www/sites/greenviz.top/index/dist";
const remoteHost = "34.150.121.233";
const username = "root";
const privateKeyPath = path.join(process.env.HOME, ".ssh", "id_rsa");

const privateKey = fs.readFileSync(privateKeyPath, "utf8");

ssh
  .connect({
    host: remoteHost,
    username: username,
    privateKey: privateKey,
  })
  .then(() => {
    return ssh.execCommand(`rm -rf ${remoteDistPath}/*`);
  })
  .then(() => {
    return ssh.putDirectory(localDistPath, remoteDistPath);
  })
  .then(() => {
    console.log("Deployment successful!");
    ssh.dispose();
  })
  .catch((err) => {
    console.error("Deployment error:", err);
    ssh.dispose();
  });
