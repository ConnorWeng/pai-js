drop table page_view;
create table page_view (
  page_view_id int(10) unsigned auto_increment not null,
  app_id varchar(100) not null,
  user_id varchar(100) not null,
  session_id varchar(100) not null,
  page_name varchar(255) not null,
  date_time int(10) unsigned not null,
  primary key (page_view_id)
) engine=MyISAM default charset=utf8 auto_increment=1;

drop table page_event;
create table page_event (
  event_id int(10) unsigned auto_increment not null,
  page_view_id int(10) unsigned not null,
  type varchar(100) not null,
  target_id varchar(100),
  target_type varchar(100),
  target_data varchar(100),
  date_time int(10) unsigned not null,
  primary key (event_id)
) engine=MyISAM default charset=utf8 auto_increment=1;

/*
 * 系统BMDP，共有4个页面login, trade_start, trade_end, logout
 * 共有4个用户访问
 * kfzx-aaa(0): login->trade_start->trade_end->logout
 *              login: click login button
 *              trade_start: fill amount input -> click trade button
 *              trade_end: click finish button
 * kfzx-aaa(1): login->trade_start
 *              login: click login button
 *              trade_start: fill amount input
 * kfzx-bbb(0): login
 * kfzx-ccc(0): login->trade_start
 *              login: click login button
 *              trade_start
 * kfzx-ddd(0): login
 *
 * exit rate: login: 2/10, trade_start: 2/10, trade_end: 0/10, logout: 1/10
 */
insert into page_view(page_view_id, app_id, user_id, session_id, page_name, date_time) values (1, 'BMDP', 'kfzx-aaa', 'DEUY7UYJ', 'login', '1441528641');
insert into page_event(event_id, page_view_id, type, target_id, target_type, target_data, date_time) values (1, 1, 'click', 'login', 'button', '{"e":"click","x":18,"y":17,"srcElement":"login"}', '1441528643');
insert into page_view(page_view_id, app_id, user_id, session_id, page_name, date_time) values (2, 'BMDP', 'kfzx-aaa', 'DEUY7UYJ', 'trade_start', '1441528644');
insert into page_event(event_id, page_view_id, type, target_id, target_type, target_data, date_time) values (2, 2, 'fill', 'amount', 'input', '{"e":"click","x":18,"y":47,"srcElement":"amount"}', '1441528648');
insert into page_event(event_id, page_view_id, type, target_id, target_type, target_data, date_time) values (3, 2, 'click', 'trade', 'button', '{"e":"click","x":18,"y":17,"srcElement":"trade"}', '1441528652');
insert into page_view(page_view_id, app_id, user_id, session_id, page_name, date_time) values (3, 'BMDP', 'kfzx-aaa', 'DEUY7UYJ', 'trade_end', '1441528654');
insert into page_event(event_id, page_view_id, type, target_id, target_type, target_data, date_time) values (4, 3, 'click', 'finish', 'button', '{"e":"click","x":18,"y":17,"srcElement":"finish"}', '1441528656');
insert into page_view(page_view_id, app_id, user_id, session_id, page_name, date_time) values (4, 'BMDP', 'kfzx-aaa', 'DEUY7UYJ', 'logout', '1441528658');

/*------------------------------------------------------------------------分割线-------------------------------------------------------------------------*/

insert into page_view(page_view_id, app_id, user_id, session_id, page_name, date_time) values (5, 'BMDP', 'kfzx-aaa', 'IUJKM8JJ', 'login', '1441528645');
insert into page_event(event_id, page_view_id, type, target_id, target_type, target_data, date_time) values (5, 5, 'click', 'login', 'button', '{"e":"click","x":18,"y":17,"srcElement":"login"}', '1441528646');
insert into page_view(page_view_id, app_id, user_id, session_id, page_name, date_time) values (6, 'BMDP', 'kfzx-aaa', 'IUJKM8JJ', 'trade_start', '1441528648');
insert into page_event(event_id, page_view_id, type, target_id, target_type, target_data, date_time) values (6, 6, 'fill', 'amount', 'input', '{"e":"click","x":18,"y":47,"srcElement":"amount"}', '1441528650');

/*------------------------------------------------------------------------分割线-------------------------------------------------------------------------*/

insert into page_view(page_view_id, app_id, user_id, session_id, page_name, date_time) values (7, 'BMDP', 'kfzx-bbb', 'OIUYTGHJ', 'login', '1441528747');

/*------------------------------------------------------------------------分割线-------------------------------------------------------------------------*/

insert into page_view(page_view_id, app_id, user_id, session_id, page_name, date_time) values (8, 'BMDP', 'kfzx-ccc', 'O987IJHG', 'login', '1441528750');
insert into page_event(event_id, page_view_id, type, target_id, target_type, target_data, date_time) values (7, 8, 'click', 'login', 'button', '{"e":"click","x":18,"y":17,"srcElement":"login"}', '1441528751');
insert into page_view(page_view_id, app_id, user_id, session_id, page_name, date_time) values (9, 'BMDP', 'kfzx-ccc', 'O987IJHG', 'trade_start', '1441528752');

/*------------------------------------------------------------------------分割线-------------------------------------------------------------------------*/

insert into page_view(page_view_id, app_id, user_id, session_id, page_name, date_time) values (10, 'BMDP', 'kfzx-ddd', 'YTGHNBT6', 'login', '1441528650');

/*
 * exit_rate: 某页面作为最后一个页面的pageview/该页面的pageviews
 * times_as_last | page_name
 *           2 | login
 *           2 | trade_start
 *           0 | trade_end
 *           1 | log_out
 */
select t.page_name, count(1)/(select count(1) from page_view where app_id = 'BMDP') as exit_rate from (select * from page_view v where app_id = 'BMDP' and v.date_time = (select max(date_time) from page_view where session_id = v.session_id)) t group by t.page_name;

/*
 * bounce rate: 只访问了一个页面然后立刻离开的访问数/总访问数
 */
select count(1)/(select count(1) from page_view where app_id = 'BMDP') as bounce_rate from (select * from page_view where app_id = 'BMDP' group by session_id having count(1) = 1) t;

/*
 * depth of visit: pageviews per session
 */
select count(1)/(select count(1) from (select * from page_view group by session_id) t) as depth_of_visit from page_view where app_id = 'BMDP';

/*
 * loyalty: 用户访问网站的频率
 */
select user_id, count(1) as loyalty from (select user_id, session_id, count(1) from page_view where app_id = 'BMDP' group by user_id, session_id) t group by user_id;

/*
 * pageview duration: 平均每个page用户停留时间
 */
select page_name, sum(duration)/count(1) as pageview_duration from (select v.page_name, (select ifnull(t.date_time,0) from page_view t where t.page_view_id > v.page_view_id limit 1) - v.date_time as duration from page_view v where app_id = 'BMDP' and exists (select 1 from page_view where session_id = v.session_id and page_view_id > v.page_view_id)) page_duration group by page_name;

/*
 * time on site: 平均每次访问网站停留时间，最后一个页面的时间不算
 */
select sum(t.time_on_site)/count(1) as average_time_on_site from (select session_id, max(date_time) - min(date_time) time_on_site from page_view where app_id = 'BMDP' group by session_id) t where t.time_on_site != 0;
