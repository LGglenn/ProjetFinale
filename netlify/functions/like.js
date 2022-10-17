const { LikeModel } = require("../../model/Liked");
const { PhotoModel } = require("../../model/Photo");
const mongoose = require('mongoose');
const Joi = require("joi");
const Promise = require("bluebird");

mongoose.connect("mongodb://localhost:27017/projet-3wa", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const schema = Joi.object({
    username: Joi.string().required(),
    photoID: Joi.string().required(),
});

exports.handler = async function (event, context) {
    try {
        if (event.httpMethod === "POST") {
            const params = JSON.parse(event.body)
            await schema.validateAsync(params);

            const allData = await LikeModel.find({ username: params.username });

            const already = allData[0].likedPhotos.filter(elem => elem === params.photoID);

            if (already[0] !== undefined) {
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: "Already liked" }),
                };
            }
            await LikeModel.updateOne({ username: params.username }, { $push: { likedPhotos: [params.photoID] } });

            return {
                statusCode: 200,
                body: JSON.stringify({ message: "succes" }),
            };
        } else if (event.httpMethod === "GET") {
            if (event.queryStringParameters.id) {
                const allData = await LikeModel.find({ username: event.queryStringParameters.username });
                const already = allData[0].likedPhotos.filter(elem => elem === event.queryStringParameters.id);

                if (already[0] === undefined) {
                    return {
                        statusCode: 200,
                        body: JSON.stringify({ message: 1 }),
                    };
                }
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: -1 }),
                };
            } else {

                const allData = await LikeModel.find({ username: event.queryStringParameters.username });

                const allPhotos = await Promise.map(
                    allData[0].likedPhotos,
                    async photo => {
                        const result = await PhotoModel.find({ _id: photo });
                        return { photoLink: result[0].photoLink, username: result[0].username, titre: result[0].title, id: result[0]._id };
                    }, { concurrency: 1 }
                );
                return {
                    statusCode: 200,
                    body: JSON.stringify({ data: allPhotos }),
                };
            }
        } else if (event.httpMethod === "DELETE") {
            const params = JSON.parse(event.body)
            await schema.validateAsync(params);

            await LikeModel.updateOne({ username: params.username }, { $pull: { likedPhotos: params.photoID } });

            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Succes" }),
            };
        } else {
            return {
                statusCode: 405,
                body: JSON.stringify({ message: "Method error" }),
            };
        }
    } catch (err) {
        console.log("error", err);
        return {
            statusCode: 400,
            body: JSON.stringify(err),
        };
    }
};