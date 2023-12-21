import express from "express";
import {
  commentPost,
  createPost,
  deletePost,
  getComments,
  getPost,
  getPosts,
  getUserPost,
  likePost,
  likePostComment,
  replyPostComment,
} from "../controllers/postController.js";
import userAuth from "../middleware/authMiddleware.js";

const postRoutes = express.Router();

// create post
postRoutes.post("/create-post", userAuth, createPost);

// get posts
postRoutes.get("/", userAuth, getPosts);

// get post
postRoutes.get("/:id", userAuth, getPost);

// get user post
postRoutes.post("/get-user-post/:id", userAuth, getUserPost);

// get comments of a particular post id
postRoutes.get("/comments/:postid", getComments);

// like a post
postRoutes.post("/like/:id", userAuth, likePost);

// like comment of a post
postRoutes.post("/like-comment/:id/:rid?", userAuth, likePostComment);

// comment on a post
postRoutes.post("/comment/:id", userAuth, commentPost);

// reply on a comment of a post
postRoutes.post("/reply-comment/:id", userAuth, replyPostComment);

// delete post
postRouter.delete("/:id", userAuth, deletePost);

export default postRoutes;
