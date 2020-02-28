const { send, json } = require("micro");
const fetch = require("node-fetch");
const config = require("./config");

const buff = new Buffer(`${config.ACCESS_SECRET}:`);
const base64data = buff.toString("base64");

const fetchPersona = async (url, type) => {
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

const handler = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const body = await json(req);
  const {
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
  if (!target)
    send(res, 400, {
      error:
        "Please profile an email, user_id, anonymous_id, or any external id"
    });

  profileURL = `${profileURL}/${target}`;

  // append traits or events to profile
  let profile = {};
  if (!!traits) {
    const prof = await fetchPersona(profileURL, "traits");
    profile = { ...profile, ...prof };
  }
  if (!!events) {
    const prof = await fetchPersona(profileURL, "events");
    profile = { ...profile, ...prof };
  }

  // send profile
  send(res, 200, { profile });
};

module.exports = handler;
