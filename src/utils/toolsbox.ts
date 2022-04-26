let utools = window.utools;

let utils = {
  getConfigList: function () {
    let allDocs = utools.db.allDocs("jenkins");
    console.log('config list', allDocs)
    let alldata = [];
    let noActive = true;
    for (let i = 0; i < allDocs.length; i++) {
      let data = allDocs[i];
      if (data.data.active) {
        noActive = false;
      }
      alldata.push(data);
    }

    if (noActive && alldata.length > 0) {
      alldata[0].data.active = true;
    }
    console.log('alldata', alldata)
    return alldata;
  },
  uuid: function () {
    let s:any[] = [];
    let hexDigits = "0123456789abcdef";
    for (let i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
    return s.join("");
  },
  jobStatusToIcon: function(job:any) {
    switch (job.color) {
      case 'red':
        job.icon = 'last-failed'
        job.anime = false
        job.color = 'icon-red'
        break
      case 'red_anime':
        job.icon = 'last-failed'
        job.anime = true
        job.color = 'icon-red'
        break
      case 'yellow':
        job.icon = 'last-unstable'
        job.anime = false
        job.color = 'icon-yellow'
        break
      case 'yellow_anime':
        job.icon = 'last-unstable'
        job.anime = true
        job.color = 'icon-yellow'
        break
      case 'blue':
        job.icon = 'last-successful'
        job.anime = false
        job.color = 'icon-blue'
        break
      case 'blue_anime':
        job.icon = 'last-successful'
        job.anime = true
        job.color = 'icon-blue'
        break
      case 'grey':
        job.icon = 'last-disabled'
        job.anime = false
        job.color = 'icon-disabled'
        break
      case 'grey_anime':
        job.icon = 'last-disabled'
        job.anime = true
        job.color = 'icon-disabled'
        break
      case 'disabled':
        job.icon = 'last-disabled'
        job.anime = false
        job.color = 'icon-disabled'
        break
      case 'disabled_anime':
        job.icon = 'last-disabled'
        job.anime = true
        job.color = 'icon-disabled'
        break
      case 'aborted':
        job.icon = 'last-aborted'
        job.anime = false
        job.color = 'icon-aborted'
        break
      case 'aborted_anime':
        job.icon = 'last-aborted'
        job.anime = true
        job.color = 'icon-aborted'
        break
      case 'notbuilt':
        job.icon = 'never-built'
        job.anime = false
        job.color = 'icon-nobuilt'
        break
      case 'notbuilt_anime':
        job.icon = 'never-built'
        job.anime = true
        job.color = 'icon-nobuilt'
        break
    }
  },
  parseDomain: function (uri: string) {
    if (!uri || uri.length === 0) {
      return ''
    }
    let regExp = new RegExp('^(((https|http|ftp|rtsp|mms)?://)?(([0-9a-z_!~*\'().&=+$%-]+: )?[0-9a-z_!~*\'().&=+$%-]+@)?(([0-9]{1,3}.){3}[0-9]{1,3}|([0-9a-z_!~*\'()-]+.)*([0-9a-z][0-9a-z-]{0,61})?[0-9a-z].[a-z]{2,6})(:[0-9]{1,4})?)((/?)|(/[0-9a-z_!~*\'().;?:@&=+$,%#-]+)+/?)$');
    let array = regExp.exec(uri);
    if (array!.length >= 2) {
      return array![1]
    }
    return ''
  }
}

export default utils;