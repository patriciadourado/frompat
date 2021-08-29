---
title: Using Netlify CMS to manage my blog posts
date: 2021-01-13T11:27:08.574Z
description: Netlify CMS is a single-page React application which acts as a
  wrapper for our Git Workflow to provide a simple and friendly User Interface
  (UI).
featuredImage: './images/netlifycms.png'
---
Since I started to think of writing some guides about everything I was learning and doing, I saw the need of starting my own blog to document my steps and help myself to remind things I've already done without losing too much time learning again from different sources. 

So, after searching between [Hugo](https://gohugo.io/) and [Gatsby](https://www.gatsbyjs.com/) and once I was familiar with React and NPM, to make things easier I chose to use a Gatsby boilerplate blog ([gatsby-starter-blog](https://www.gatsbyjs.com/starters/gatsbyjs/gatsby-starter-blog)).

![GatsbyVsHugo](/images/gatsby-vs-hugo.png "Gatsby vs Hugo")

Writing my first post about styled-components on this blog directly in Markdown, made me want so hard an editor or something to manage the file posts without having to worry about .md syntax and etc. So I found [Netlify CMS](https://www.netlifycms.org/) with this incredibly support to Gatsby! 

> Netlify CMS is an open-source content management system (CMS) for static site generators that allows to edit our content and data as commits in applications Git Repositories in Markdown, JSON, YAML or TOML format.

![netlifycms](/images/netlifycms.png "NetlifyCMS")

Following the guide on this [link](https://www.netlifycms.org/docs/gatsby/) that I will detail here too, it was so easy to setup everything and starting using the Netlify CMS as I'm doing right now.

### Install Netlify CMS

So, on my blog project root directory I've just needed to install Netlify CMS through the following command:

```
npm install --save netlify-cms-app gatsby-plugin-netlify-cms
```

After installation, create a small config file called *config.yml* in the directory static/admin/config.yml on my gatsby blog project. The *config.yml* must have the following configuration:

```
backend:
  name: git-gateway
  branch: master

media_folder: static/img
public_folder: /img

collections:
  - name: 'blog'
    label: 'Blog'
    folder: 'content/blog'
    create: true
    slug: 'index'
    media_folder: ''
    public_folder: ''
    path: '{{title}}/index'
    editor:
      preview: false
    fields:
      - { label: 'Title', name: 'title', widget: 'string' }
      - { label: 'Publish Date', name: 'date', widget: 'datetime' }
      - { label: 'Description', name: 'description', widget: 'string' }
      - { label: 'Body', name: 'body', widget: 'markdown' }
```

Next step is to add the plugin line to *gatsby-config.js*

```
plugins: [`gatsby-plugin-netlify-cms`]
```

### Git Push your modifications

Finally, commit your changes and push the modified repository to your GitHub:

```
git add .
git commit -m "setup netlify cms"
git remote add origin https://github.com/YOUR_USERNAME/NEW_REPO_NAME.git
git push -u origin master
```

###  Add your repo to Netlify

Go to Netlify and select 'New Site from Git'. Select GitHub and the repository you just pushed to. Click Configure Netlify on GitHub and give access to your repository. Finish the setup by clicking Deploy Site. Netlify will begin reading your repository and starting building your project.

### Enable Identity and Git Gateway

Netlify's Identity and Git Gateway services allow you to manage CMS admin users for your site without requiring them to have an account with your Git host or commit access on your repo. From your site dashboard on Netlify:

Go to **Settings > Identity**, and select **Enable Identity service**.
Under **Registration preferences**, select **Open** or **Invite only**. In most cases, you want only invited users to access your CMS, but if you're just experimenting, you can leave it open for convenience.
If you'd like to allow one-click login with services like Google and GitHub, check the boxes next to the services you'd like to use, under **External providers**.
Scroll down to **Services > Git Gateway**, and click **Enable Git Gateway**. This authenticates with your Git host and generates an API access token. In this case, we're leaving the **Roles** field blank, which means any logged in user may access the CMS. For information on changing this, check the [Netlify Identity documentation](https://www.netlify.com/docs/identity/).

### Start publishing

It's time to create your first blog post. Login to your site's */admin/* page and create a new post by clicking New Blog. Add a title, a date and some text. When you click Publish, a new commit will be created in your GitHub repo with this format *Create Blog “year-month-date-title”*.

Then Netlify will detect that there was a commit in your repo, and will start rebuilding your project. When your project is deployed you'll be able to see the post you created.

###### Hope you enjoy Netlify CMS! :)