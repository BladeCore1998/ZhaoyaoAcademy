import ProfilePanel from "./ProfilePanel";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-[760px] px-6 pb-20 pt-20 max-md:pt-5">
      <p className="eyebrow">个人资料</p>
      <h1 className="text-[clamp(42px,7vw,68px)]">我的</h1>
      <p className="page-intro">更新头像，让你的来信和收藏更有自己的印记。</p>
      <div className="mt-10">
        <ProfilePanel />
      </div>
    </div>
  );
}
