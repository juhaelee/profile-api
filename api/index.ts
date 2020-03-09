import { NowRequest, NowResponse } from "@now/node";
import fetch from "node-fetch";
import Cors from "micro-cors";
import config from "../config";

const cors = Cors();

const fetchPersona = async (url, type) => {
  const buff = new Buffer(`${config.ACCESS_SECRET}:`);
  const base64data = buff.toString("base64");
  const response = await fetch(`${url}/${type}`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${base64data}`,
      "Content-Type": "application/json"
    }
  });
  const data = await response.json();
  return data;
};

const handler = async (req: NowRequest, res: NowResponse) => {
  // handle options
  if (req.method === "OPTIONS") {
    return res.status(200).send("ok!");
  }

  let { body = {} } = req;

  let {
    email,
    user_id,
    anonymous_id,
    extern_id_key,
    extern_id_value,
    traits = true,
    events = false
  } = body;

  let profileURL = `https://profiles.segment.com/v1/spaces/${config.NAMESPACE_ID}/collections/users/profiles`;

  let target;
  if (!!user_id) {
    target = `user_id:${user_id}`;
  } else if (!!email) {
    target = `email:${email}`;
  } else if (!!anonymous_id) {
    target = `anonymous_id:${anonymous_id}`;
  } else if (!!extern_id_key && !!extern_id_value) {
    target = `${extern_id_key}:${extern_id_value}`;
  }

  // throw error if there is no target
  if (!target) {
    res.status(400).send({
      error:
        "Please profile an email, user_id, anonymous_id, or any external id"
    });
  }

  profileURL = `${profileURL}/${target}`;

  // append traits or events to profile
  let profile = {};
  if (!!traits) {
    const prof = await fetchPersona(profileURL, "traits");
    if (prof.error) res.status(400).send({ error: prof.error });
    profile = { ...profile, ...prof };
  }
  if (!!events) {
    const prof = await fetchPersona(profileURL, "events");
    if (prof.error) res.status(400).send({ error: prof.error });
    profile = { ...profile, ...prof };
  }

  // send profile
  res.json({ profile });
};

export default cors(handler);
