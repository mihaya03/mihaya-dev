-- テストデータベース用のサンプルデータ
-- 使用方法: mysql -u username -p -h host -P port mihaya-dev-test < test-data.sql

-- 既存データをクリア（必要に応じて）
DELETE FROM `_PostTags`;
DELETE FROM `post`;
DELETE FROM `tag`;

-- タグデータの挿入（IDは自動生成）
INSERT INTO `tag` (`name`) VALUES
('TypeScript'),
('JavaScript'),
('React'),
('Next.js'),
('Prisma'),
('TiDB'),
('Node.js'),
('GitHub Actions'),
('Cloudflare'),
('テスト');

-- 投稿データの挿入（IDは自動生成）
INSERT INTO `post` (`title`, `content`, `createdAt`, `updatedAt`) VALUES
('TypeScriptの型安全性について', 
 'TypeScriptは静的型付けにより、開発時にエラーを検出できる優れた言語です。特にプロジェクトが大きくなるにつれて、その恩恵を感じることができます。',
 '2024-01-15 10:30:00',
 '2024-01-15 10:30:00'),

('Reactフックの活用方法', 
 'Reactフックを使用することで、関数コンポーネントでも状態管理やライフサイクルメソッドを使用できます。useStateやuseEffectなどの基本的なフックから始めましょう。',
 '2024-01-16 14:20:00',
 '2024-01-16 14:20:00'),

('Next.jsのSSRとSSGの違い', 
 'Next.jsではSSR（Server Side Rendering）とSSG（Static Site Generation）を使い分けることができます。それぞれの特徴とユースケースを理解しましょう。',
 '2024-01-17 09:15:00',
 '2024-01-17 09:15:00'),

('Prismaを使ったデータベース操作', 
 'PrismaはTypeScript/JavaScriptのためのモダンなORMです。型安全なデータベース操作と優れた開発体験を提供します。',
 '2024-01-18 16:45:00',
 '2024-01-18 16:45:00'),

('GitHub Actionsによる自動化', 
 'GitHub ActionsでCI/CDパイプラインを構築することで、テストやデプロイを自動化できます。ワークフローの設定方法を学びましょう。',
 '2024-01-19 11:30:00',
 '2024-01-19 11:30:00'),

('Cloudflare Workersの活用', 
 'Cloudflare Workersを使用することで、エッジコンピューティング環境でJavaScriptコードを実行できます。レスポンス時間の改善に効果的です。',
 '2024-01-20 13:20:00',
 '2024-01-20 13:20:00'),

('テスト駆動開発の実践', 
 'TDD（Test Driven Development）は、テストを先に書いてからコードを実装する開発手法です。品質向上と設計改善に役立ちます。',
 '2024-01-21 15:10:00',
 '2024-01-21 15:10:00');

-- 投稿とタグの関連付けは実際のIDを取得してから行う必要があります
-- 以下は参考用のクエリです：

-- データ挿入の確認
SELECT 
    p.id, 
    p.title, 
    GROUP_CONCAT(t.name) as tags,
    p.createdAt
FROM post p
LEFT JOIN _PostTags pt ON p.id = pt.A
LEFT JOIN tag t ON pt.B = t.id
GROUP BY p.id, p.title, p.createdAt
ORDER BY p.createdAt;