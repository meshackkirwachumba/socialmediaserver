import Comments from "../models/commentModel.js";
import Posts from "../models/postModel.js";
import Users from "../models/userModel.js";

export const createPost = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { description, image } = req.body;

    if (!description) {
      next("Please enter description");
      return;
    }

    const post = await Posts.create({
      userId,
      description,
      image,
    });

    res.status(201).json({
      success: true,
      data: post,
      message: "Post created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

//get posts
export const getPosts = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { search } = req.body;

    const user = await Users.findById(userId);
    const friends = user?.friends?.toString().split(",") ?? [];
    friends.push(userId);

    const searchPostQuery = {
      $or: [
        {
          description: { $regex: search, $options: "i" },
        },
      ],
    };

    const posts = await Posts.find(search ? searchPostQuery : {})
      .populate({
        path: "userId",
        select: "firstName lastName location profileUrl -password",
      })
      .sort({ _id: -1 });

    const friendPosts = posts?.filter((post) => {
      return friends.includes(post?.userId?._id.toString());
    });

    const otherPosts = posts?.filter(
      (post) => !friends.includes(post?.userId?._id.toString())
    );

    let postRes = null;

    if (friendPosts?.length > 0) {
      postRes = search ? friendPosts : [...friendPosts, ...otherPosts];
    } else {
      postRes = posts;
    }

    res.status(200).json({
      success: true,
      message: "successfully fetched posts",
      data: postRes,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// get post by id
export const getPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Posts.findById(id).populate({
      path: "userId",
      select: "firstName lastName location profileUrl -password",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

//get user post
export const getUserPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Posts.find({ userId: id })
      .populate({
        path: "userId",
        select: "firstName lastName location profileUrl -password",
      })
      .sort({ _id: -1 });

    res.status(200).json({
      success: true,
      message: "successfully fetched post",
      data: post,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// get comments of a particular post id

export const getComments = async (req, res, next) => {
  try {
    const { postid } = req.params;

    const postComments = await Comments.find({ postId: postid })
      .populate({
        path: "userId",
        select: "firstName lastName location profileUrl -password",
      })
      .populate({
        path: "replies.userId",
        select: "firstName lastName location profileUrl -password",
      })
      .sort({ _id: -1 });

    res.status(200).json({
      success: true,
      message: "successfully fetched comments",
      data: postComments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// like a post
export const likePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body.user;

    const post = await Posts.findById(id);

    const index = post.likes.findIndex((id) => id === String(userId));

    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes = post.likes.filter((id) => id !== String(userId));
    }

    const newPost = await Posts.findByIdAndUpdate(id, post, { new: true });

    res.status(200).json({
      success: true,
      message: "successfully",
      data: newPost,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// like post comment
export const likePostComment = async (req, res, next) => {
  try {
    const { userId } = req.body.user;
    const { id, rid } = req.params;

    if (rid === undefined || rid === null || rid === `false`) {
      const comment = Comments.findById(id);

      const index = comment.likes.findIndex((id) => id === String(userId));

      if (index === -1) {
        comment.likes.push(userId);
      } else {
        comment.likes = comment.likes.filter((id) => id !== String(userId));
      }

      const updated = await Comments.findByIdAndUpdate(id, comment, {
        new: true,
      });

      res.status(200).json({ updated });
    } else {
      const replyComments = await Comments.findOne(
        { _id: id },
        { replies: { $elemMatch: { _id: rid } } }
      );

      const index = replyComments?.replies[0]?.likes.findIndex(
        (id) => id === String(userId)
      );

      if (index === -1) {
        replyComments.replies[0].likes.push(userId);
      } else {
        replyComments.replies[0].likes = replyComments.replies[0].likes.filter(
          (id) => id !== String(userId)
        );
      }

      const query = { _id: id, "replies._id": rid };

      const updated = {
        $set: {
          "replies.$.likes": replyComments.replies[0].likes,
        },
      };

      const result = await Comments.updateOne(query, updated, { new: true });

      res.status(201).json({ result });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// comment on a post
export const commentPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment, from } = req.body;
    const { userId } = req.body.user;

    if (comment === null) {
      return res.status(400).json({ message: "comment cannot be empty" });
    }

    const newComment = new Comments({ comment, from, userId, postId: id });

    await newComment.save();

    // updating post with the new comment id
    const post = await Posts.findById(id);
    post.comments.push(newComment._id);

    const updatedPost = await Posts.findByIdAndUpdate(id, post, { new: true });

    res.status(201).json({ updatedPost });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// reply on a comment of a post
export const replyPostComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment, from, replyAt } = req.body;
    const { userId } = req.body.user;

    if (comment === null) {
      return res.status(400).json({ message: "comment cannot be empty" });
    }

    const commentInfo = await Comments.findById(id);

    commentInfo.replies.push({
      comment,
      replyAt,
      from,
      userId,
      created_At: Date.now(),
      updated_At: Date.now(),
    });

    commentInfo.save();

    res.status(201).json({ commentInfo });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// delete post
export const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    await Posts.findByIdAndDelete(id);

    res
      .status(200)
      .json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
