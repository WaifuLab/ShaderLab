#!/usr/bin/env node
const { spawn } = require("node:child_process");
const path = require("node:path");

void function(cwd, debug, ...args) {
    const stdio = ["ignore", "pipe", debug ? "inherit" : "pipe"];
    const filterArgs = args.filter(args => ![null, undefined].includes(args));
    const command = `mkdocs ${filterArgs.join(" ")}`;
    console.info("Executing compile command", command);
    return new Promise((resolve, reject) =>  {
        const thread = spawn("mkdocs", filterArgs, { cwd, stdio });
        const buffers = [];
        if (stdio[2] !== "inherit") {
            thread.stdout.on("data", data => buffers.push(data));
            thread.stderr.on("data", data => buffers.push(data));
        }
        thread.on("error", () => reject(new Error(`Command failed ${command}`)));
        thread.on("exit", code => {
            const stdoutData = Buffer.concat(buffers);
            if (code === 0) {
                resolve(stdoutData.toString("utf-8").trim());
            } else {
                new Error(`Command ${command} failed with code ${code}. Error Message: ${stdoutData}`);
            }
        });
    });
}(path.resolve(__dirname, ".."), true, "build").then();
