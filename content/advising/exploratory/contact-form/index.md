---
title: Exploratory Contact Form
---

::moca-container
---
width: default
margin_y: "4"
---
#content
  :::moca-row
  #columns
    ::::moca-column
    ---
    width: auto
    ---
    #content
      :::::moca-heading
      ---
      text: Contact Us
      level: h1
      ---
      :::::

      :::::moca-form
      ---
      action: https://ouresources.usu.edu/_assets/forms/forms.php
      hidden_fields: |-
        asset_id=309727
        form_uuid=dfadb723-2915-41c7-9e91-58cd6002c5b2
        site_name=USU
      submit_text: Submit
      honeypot: true
      ---
      #fields
        ::::::moca-form-field
        ---
        label: A-Number
        name: name
        type: text
        required: true
        ---
        ::::::

        ::::::moca-form-field
        ---
        label: Email
        name: email
        type: text
        required: true
        ---
        ::::::

        ::::::moca-form-field
        ---
        label: Questions or Comments
        name: questionsorcomments
        type: textarea
        required: true
        ---
        ::::::
      :::::
    ::::
  :::

  :::moca-row
  ---
  padding_y: "3"
  ---
  #columns
    ::::moca-column
    ---
    width_lg: "4"
    ---
    #content
      :::::moca-icon-card
      ---
      header: Office
      body: Taggart Student Center 302
      body_link: https://www.usu.edu/map/index.cfm?id=53
      icon: fas fa-map-marker-alt
      icon_size: "3"
      sr_only: Map Marker
      color: bg-primary
      ---
      :::::
    ::::

    ::::moca-column
    ---
    width_lg: "4"
    ---
    #content
      :::::moca-icon-card
      ---
      header: Phone
      body: 435-797-3373
      body_link: tel:435-797-3373
      icon: fas fa-mobile-alt
      icon_size: "3"
      sr_only: Mobile Phone
      color: bg-primary
      ---
      :::::
    ::::

    ::::moca-column
    ---
    width_lg: "4"
    ---
    #content
      :::::moca-icon-card
      ---
      header: Email
      body: exploratoryadvising@usu.edu
      body_link: mailto:exploratoryadvising@usu.edu
      icon: fas fa-envelope
      icon_size: "3"
      sr_only: Email icon
      color: bg-primary
      ---
      :::::
    ::::
  :::
::
